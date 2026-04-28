import { google } from 'googleapis';
import { getSheetsAuth } from './google-sheets-storage';

export async function getCalendarClient() {
  const auth = await getSheetsAuth();
  if (!auth) return null;
  return google.calendar({ version: 'v3', auth });
}

export async function getCalendarIdForSlug(slug: string): Promise<string> {
  const mapping: Record<string, string> = {
    'apartament-premium-king': 'KING',
    'premium-king': 'KING',
    'apartament-deluxe-double': 'DUBLA_DELUXE',
    'deluxe-double': 'DUBLA_DELUXE',
    'apartament-family-standard': 'FAMILIE',
    'family-standard': 'FAMILIE',
    'apartament-family-deluxe': 'FAMILIE_DELUXE',
    'family-deluxe': 'FAMILIE_DELUXE',
    'peraduo': 'PERADUO',
    'peraconfort': 'PERACONFORT',
    'pera-duo': 'PERADUO',
    'pera-confort': 'PERACONFORT'
  };

  const key = mapping[slug.toLowerCase()];
  const altKey = slug.replace(/-/g, '_').toUpperCase().replace('APARTAMENT_', '');

  // 1. Check consolidated JSON first
  if (process.env.GOOGLE_CALENDAR_IDS_JSON) {
    try {
      const idsMap = JSON.parse(process.env.GOOGLE_CALENDAR_IDS_JSON);
      if (key && idsMap[key]) return idsMap[key];
      if (idsMap[altKey]) return idsMap[altKey];
      if (idsMap[slug]) return idsMap[slug];
    } catch (e) {
      console.error("Error parsing GOOGLE_CALENDAR_IDS_JSON:", e);
    }
  }

  // 2. Check individual variables with all possible keys
  const keysToTry = [key, altKey, slug.toUpperCase()].filter(Boolean) as string[];
  for (const k of keysToTry) {
    const val = process.env[`GOOGLE_CALENDAR_ID_${k}`];
    if (val) return val;
  }
  
  return 'primary';
}

export async function addBookingToCalendar(bookingData: any) {
  const calendar = await getCalendarClient();
  if (!calendar) {
    console.error("Google Calendar client failed to initialize.");
    return;
  }

  const calendarId = await getCalendarIdForSlug(bookingData.apartmentId || '');
  console.log(`[Google Calendar] Adding booking for ${bookingData.apartmentId} to calendar: ${calendarId}`);

  const event = {
    summary: `Rezervare: ${bookingData.guestName}`,
    location: 'Pera Apartments, Cristian, Brasov',
    description: `Rezervare efectuată de pe site.\nClient: ${bookingData.guestName}\nEmail: ${bookingData.guestEmail}\nPreț: ${bookingData.totalPrice} RON`,
    start: {
      date: bookingData.checkIn,
      timeZone: 'Europe/Bucharest',
    },
    end: {
      date: bookingData.checkOut,
      timeZone: 'Europe/Bucharest',
    },
    transparency: 'opaque',
    reminders: { useDefault: true },
  };

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return res.data.id;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
  }
}

export async function getBlockedDatesFromCalendar(slug: string): Promise<string[]> {
  const calendar = await getCalendarClient();
  if (!calendar) return [];

  const calendarId = await getCalendarIdForSlug(slug);
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin: today.toISOString(),
      timeMax: nextYear.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    console.log(`[Google Calendar Sync] Fetched ${events.length} events for ${slug} from ${calendarId}`);
    const blockedDates: Set<string> = new Set();

    events.forEach(event => {
      // Since it's a dedicated calendar for this room, we block ALL events found in it
      if (event.start?.date && event.end?.date) {
        let current = new Date(event.start.date);
        const end = new Date(event.end.date);
        while (current < end) {
          blockedDates.add(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      } else if (event.start?.dateTime && event.end?.dateTime) {
        let current = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        while (current <= end) {
          blockedDates.add(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    return Array.from(blockedDates);
  } catch (error) {
    console.error(`Error fetching events from Google Calendar (${calendarId}):`, error);
    return [];
  }
}

/**
 * Syncs events from an external iCal URL (Airbnb/Booking) into a Google Calendar.
 * Uses event summary and dates as a basic check to avoid duplicates.
 */
export async function syncExternalIcalToGoogle(slug: string, url: string, sourceName: string) {
  const calendar = await getCalendarClient();
  if (!calendar) return;

  const calendarId = await getCalendarIdForSlug(slug);
  if (!calendarId || calendarId === 'primary') {
    console.log(`[Sync ${sourceName}] Skipping ${slug} - No specific Calendar ID found.`);
    return;
  }

  try {
    const { getBlockedDatesFromIcal } = await import('./ical-sync');
    // We need more than just dates, we need the full events from the iCal
    const axios = (await import('axios')).default;
    const ical = (await import('node-ical')).default;
    
    const response = await axios.get(url);
    const data = ical.parseICS(response.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch existing events from Google to skip duplicates
    const res = await calendar.events.list({
      calendarId,
      timeMin: today.toISOString(),
      singleEvents: true,
    });
    const existingEvents = res.data.items || [];
    
    // Create a set of "duplicate detectors"
    // We use UID if we stored it in the description, or summary+dates
    const existingKeys = new Set();
    existingEvents.forEach(e => {
      // Try to find UID in description (we store it there)
      const uidMatch = e.description?.match(/UID iCal: (.+)/);
      if (uidMatch) {
        existingKeys.add(uidMatch[1]);
      }
      // Also add summary-date key as fallback
      const start = e.start?.date || (e.start?.dateTime ? e.start.dateTime.split('T')[0] : '');
      const end = e.end?.date || (e.end?.dateTime ? e.end.dateTime.split('T')[0] : '');
      existingKeys.add(`${e.summary?.toLowerCase()}-${start}-${end}`);
    });

    console.log(`[Sync ${sourceName}] Checking ${slug} for new events. Already has ${existingEvents.length} events in Google.`);

    for (const k in data) {
      const ev = data[k];
      if (ev.type === 'VEVENT' && ev.start && ev.end) {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        
        if (end < today) continue; // Skip past events

        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        const summary = `${sourceName}: Rezervare`;
        const eventKey = `${summary.toLowerCase()}-${startDateStr}-${endDateStr}`;
        const uid = ev.uid || `${eventKey}-${k}`;

        if (!existingKeys.has(uid) && !existingKeys.has(eventKey)) {
          console.log(`[Sync ${sourceName}] Adding new event to ${slug} (${calendarId}): ${startDateStr} - ${endDateStr}`);
          
          await calendar.events.insert({
            calendarId,
            requestBody: {
              summary,
              description: `Sincronizat automat din ${sourceName}.\nUID iCal: ${uid}`,
              start: { date: startDateStr },
              end: { date: endDateStr },
              transparency: 'opaque',
              colorId: sourceName === 'Airbnb' ? '11' : '1', // Red for Airbnb, Blue for Booking
            }
          });
          
          existingKeys.add(uid);
          existingKeys.add(eventKey);
        }
      }
    }
  } catch (error: any) {
    console.error(`[Sync ${sourceName}] Failed for ${slug}:`, error.message);
  }
}
