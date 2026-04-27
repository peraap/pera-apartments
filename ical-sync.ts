import ical from 'node-ical';
import axios from 'axios';
import { eachDayOfInterval, format, parseISO, isAfter, startOfDay } from 'date-fns';
import { getBlockedDatesFromCalendar } from './google-calendar-service';

export async function getBlockedDatesFromIcal(url: string): Promise<string[]> {
  try {
    const response = await axios.get(url);
    const data = ical.parseICS(response.data);
    const blockedDates: Set<string> = new Set();
    const today = startOfDay(new Date());

    for (const k in data) {
      if (data.hasOwnProperty(k)) {
        const ev = data[k];
        if (ev.type === 'VEVENT' && ev.start && ev.end) {
          const start = new Date(ev.start);
          const end = new Date(ev.end);

          // Only care about future or current bookings
          if (isAfter(end, today)) {
            const days = eachDayOfInterval({
              start: start,
              end: end
            });

            days.forEach(day => {
              blockedDates.add(format(day, 'yyyy-MM-dd'));
            });
          }
        }
      }
    }

    return Array.from(blockedDates);
  } catch (error) {
    console.error(`Error fetching iCal from ${url}:`, error);
    return [];
  }
}

export async function getApartmentBlockedDates(slug: string): Promise<string[]> {
  // Convert slug to uppercase for env matching 
  const envKey = slug.replace(/-/g, '_').toUpperCase().replace('APARTAMENT_', '');
  
  const bookingUrl = process.env[`ICAL_BOOKING_${envKey}`];
  const airbnbUrl = process.env[`ICAL_AIRBNB_${envKey}`];

  // Also fetch from Google Calendar if configured
  const googleCalendarPromise = process.env.GOOGLE_CALENDAR_ID ? 
    getBlockedDatesFromCalendar(slug) : 
    Promise.resolve([]);

  const results: string[][] = await Promise.all([
    bookingUrl ? getBlockedDatesFromIcal(bookingUrl) : Promise.resolve([]),
    airbnbUrl ? getBlockedDatesFromIcal(airbnbUrl) : Promise.resolve([]),
    googleCalendarPromise
  ]);

  // 3. Check manual blocks in Firestore
  let manualDates: string[] = [];
  try {
    if (adminDb) {
      const snapshot = await adminDb.collection('manual_blocks')
        .where('apartmentId', '==', slug)
        .get();
      
      snapshot.forEach((doc: any) => {
        const block = doc.data();
        if (block.startDate && block.endDate) {
          const range = eachDayOfInterval({
            start: new Date(block.startDate),
            end: new Date(block.endDate)
          });
          manualDates = [...manualDates, ...range.map(d => format(d, 'yyyy-MM-dd'))];
        }
      });
    }
  } catch (e) {
    console.warn("Manual blocks fetch failed, skipping...");
  }

  // Merge and remove duplicates from all sources
  const allDates = new Set([...results[0], ...results[1], ...results[2], ...manualDates]);
  return Array.from(allDates);
}
