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
  const normalizedSlug = slug.toLowerCase().trim();
  
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
    'pera-confort': 'PERACONFORT',
    'camera-king': 'KING',
    'camera-dubla': 'DUBLA_DELUXE',
    'camera-familie': 'FAMILIE',
    'family-room': 'FAMILIE'
  };

  const key = mapping[normalizedSlug];
  const altKey = normalizedSlug.replace(/-/g, '_').toUpperCase().replace('APARTAMENT_', '');

  // 1. Check consolidated JSON first
  if (process.env.GOOGLE_CALENDAR_IDS_JSON) {
    try {
      const idsMap = JSON.parse(process.env.GOOGLE_CALENDAR_IDS_JSON);
      if (key && idsMap[key]) return idsMap[key];
      if (idsMap[altKey]) return idsMap[altKey];
      if (idsMap[normalizedSlug.toUpperCase().replace(/-/g, '_')]) return idsMap[normalizedSlug.toUpperCase().replace(/-/g, '_')];
      if (idsMap[normalizedSlug.toUpperCase()]) return idsMap[normalizedSlug.toUpperCase()];
      if (idsMap[normalizedSlug]) return idsMap[normalizedSlug];
    } catch (e) {
      console.error("Error parsing GOOGLE_CALENDAR_IDS_JSON:", e);
    }
  }

  // 2. Check individual variables with all possible keys
  const keysToTry = [
    key, 
    altKey, 
    normalizedSlug.replace(/-/g, '_').toUpperCase(), 
    normalizedSlug.toUpperCase()
  ].filter(Boolean) as string[];
  
  for (const k of keysToTry) {
    const val = process.env[`GOOGLE_CALENDAR_ID_${k}`];
    if (val) return val;
  }
  
  // Also try exact slug in case user named it GOOGLE_CALENDAR_ID_apartament-king
  const directKey = process.env[`GOOGLE_CALENDAR_ID_${normalizedSlug}`];
  if (directKey) return directKey;

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
  today.setHours(0, 0, 0, 0);
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
      const summary = event.summary || 'Blocked';
      // Since it's a dedicated calendar for this room, we block ALL events found in it
      if (event.start?.date && event.end?.date) {
        let current = new Date(event.start.date);
        const end = new Date(event.end.date);
        console.log(`[Google Calendar] Processing All-Day event: "${summary}" (${event.start.date} to ${event.end.date})`);
        while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          blockedDates.add(dateStr);
          current.setDate(current.getDate() + 1);
        }
      } else if (event.start?.dateTime && event.end?.dateTime) {
        let current = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        console.log(`[Google Calendar] Processing Timed event: "${summary}" (${event.start.dateTime} to ${event.end.dateTime})`);
        
        // Use a safer day-by-day addition
        const tempStart = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        const tempEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        let iter = new Date(tempStart);
        while (iter < tempEnd) {
          blockedDates.add(iter.toISOString().split('T')[0]);
          iter.setDate(iter.getDate() + 1);
        }
        // If it starts late or ends early on a day, we might need more nuanced logic, 
        // but for a rental calendar, if there's a booking, that night is blocked.
      }
    });

    const finalDates = Array.from(blockedDates);
    console.log(`[Google Calendar] Total blocked dates found for ${slug}: ${finalDates.length}`);
    return finalDates;
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
    const errorMsg = `No specific Calendar ID found for ${slug}. Falling back to primary (not recommended).`;
    console.warn(`[Sync ${sourceName}] ⚠️ ${errorMsg}`);
    // Optional: throw new Error(errorMsg) if you want to explicitly fail
  }

  try {
    console.log(`[Sync ${sourceName}] Fetching ical from: ${url}`);
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (PeraApartments-Sync/1.0)' }
    });
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
    const existingDates = new Set();
    existingEvents.forEach(e => {
      const uidMatch = e.description?.match(/UID iCal: (.+)/);
      if (uidMatch) {
        existingKeys.add(uidMatch[1].trim());
      }
      const start = e.start?.date || (e.start?.dateTime ? e.start.dateTime.split('T')[0] : '');
      const end = e.end?.date || (e.end?.dateTime ? e.end.dateTime.split('T')[0] : '');
      
      if (start && end) {
        existingKeys.add(`${e.summary?.toLowerCase()}-${start}-${end}`);
        if (e.summary?.toLowerCase().includes('rezervare') || e.description?.includes('Sincronizat')) {
          existingDates.add(`${start}-${end}`);
        }
      }
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
        
        // Try to detect source more robustly
        let effectiveSource = sourceName;
        const icalSummary = (ev.summary || '').toString().toLowerCase();
        const icalDescription = (ev.description || '').toString().toLowerCase();
        
        if (sourceName === 'Airbnb') {
          if (icalSummary.includes('booking') || icalDescription.includes('booking')) {
            effectiveSource = 'Booking.com';
          } else if (icalSummary.includes('expedia') || icalDescription.includes('expedia')) {
            effectiveSource = 'Expedia';
          } else if (icalSummary.includes('reserved') && !icalSummary.includes('airbnb')) {
            // generic reserved often comes from other imports in airbnb
            effectiveSource = 'External (Sync)';
          }
        }

        const summary = `${effectiveSource}: Rezervare`;
        const eventKey = `${summary.toLowerCase()}-${startDateStr}-${endDateStr}`;
        const dateKey = `${startDateStr}-${endDateStr}`;
        const uid = (ev.uid || `${eventKey}-${k}`).toString().trim();

        if (!existingKeys.has(uid) && !existingKeys.has(eventKey) && !existingDates.has(dateKey)) {
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
              colorId: effectiveSource === 'Airbnb' ? '11' : (effectiveSource.includes('External') ? '8' : '1'), 
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
