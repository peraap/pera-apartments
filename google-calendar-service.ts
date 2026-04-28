import { google } from 'googleapis';
import axios from 'axios';
import icalParser from 'node-ical';
import { getSheetsAuth } from './google-sheets-storage';

export async function getCalendarClient() {
  console.log("[Calendar] Initializing client...");
  const auth = await getSheetsAuth();
  if (!auth) {
    console.error("[Calendar] Auth failed to initialize.");
    return null;
  }
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
      if (idsMap[slug.toUpperCase().replace(/-/g, '_')]) return idsMap[slug.toUpperCase().replace(/-/g, '_')];
      if (idsMap[slug.toUpperCase()]) return idsMap[slug.toUpperCase()];
      if (idsMap[slug]) return idsMap[slug];
    } catch (e) {
      console.error("Error parsing GOOGLE_CALENDAR_IDS_JSON:", e);
    }
  }

  // 2. Check individual variables with all possible keys
  const keysToTry = [key, altKey, slug.toUpperCase().replace(/-/g, '_'), slug.toUpperCase()].filter(Boolean) as string[];
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
 */
export async function syncExternalIcalToGoogle(slug: string, url: string, sourceName: string) {
  console.log(`[Sync ${sourceName}] Starting sync for ${slug}...`);
  
  const calendar = await getCalendarClient();
  if (!calendar) {
    console.error(`[Sync ${sourceName}] ❌ Google Calendar client failed to initialize.`);
    return;
  }

  const calendarId = await getCalendarIdForSlug(slug);
  if (!calendarId || calendarId === 'primary') {
    console.log(`[Sync ${sourceName}] ⚠️ Skipping ${slug} - No specific Calendar ID found.`);
    return;
  }

  try {
    console.log(`[Sync ${sourceName}] Fetching ical from: ${url}`);
    const response = await axios.get(url, { timeout: 8000 });
    const data = icalParser.parseICS(response.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch existing events from Google to skip duplicates
    console.log(`[Sync ${sourceName}] Fetching existing events from Google...`);
    const res = await calendar.events.list({
      calendarId,
      timeMin: today.toISOString(),
      singleEvents: true,
      maxResults: 250 // Limit results to avoid memory issues
    });
    
    const existingEvents = res.data.items || [];
    
    // Create a set of "duplicate detectors"
    const existingKeys = new Set();
    existingEvents.forEach(e => {
      const uidMatch = e.description?.match(/UID iCal: (.+)/);
      if (uidMatch) {
        existingKeys.add(uidMatch[1].trim());
      }
      const start = e.start?.date || (e.start?.dateTime ? e.start.dateTime.split('T')[0] : '');
      const end = e.end?.date || (e.end?.dateTime ? e.end.dateTime.split('T')[0] : '');
      existingKeys.add(`${e.summary?.toLowerCase()}-${start}-${end}`);
    });

    console.log(`[Sync ${sourceName}] Found ${Object.keys(data).length} items in iCal. Google has ${existingEvents.length} upcoming events.`);

    let addedCount = 0;
    for (const k in data) {
      const ev = data[k];
      if (ev.type === 'VEVENT' && ev.start && ev.end) {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        
        if (end < today) continue; 

        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        const summary = `${sourceName}: Rezervare`;
        const eventKey = `${summary.toLowerCase()}-${startDateStr}-${endDateStr}`;
        const uid = (ev.uid || `${eventKey}-${k}`).toString().trim();

        if (!existingKeys.has(uid) && !existingKeys.has(eventKey)) {
          console.log(`[Sync ${sourceName}] ➕ Adding: ${startDateStr} - ${endDateStr}`);
          
          await calendar.events.insert({
            calendarId,
            requestBody: {
              summary,
              description: `Sincronizat automat din ${sourceName}.\nUID iCal: ${uid}`,
              start: { date: startDateStr },
              end: { date: endDateStr },
              transparency: 'opaque',
              status: 'confirmed',
              colorId: sourceName === 'Airbnb' ? '11' : '1', 
            }
          });
          
          existingKeys.add(uid);
          existingKeys.add(eventKey);
          addedCount++;
        }
      }
    }
    console.log(`[Sync ${sourceName}] ✅ Finished ${slug}. Added ${addedCount} new events.`);
  } catch (error: any) {
    console.error(`[Sync ${sourceName}] ❌ Failed for ${slug}:`, error.message);
    throw error; // Re-throw to catch in the API handler
  }
}
