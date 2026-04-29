import ical from 'node-ical';
import axios from 'axios';
import { eachDayOfInterval, format, parseISO, isAfter, startOfDay } from 'date-fns';
import { getBlockedDatesFromCalendar } from './google-calendar-service';
import { adminDb } from './firebase-admin-service';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "./src/firebase-config";

// Fallback client SDK for when Admin SDK is missing
const clientApp = initializeApp(firebaseConfig);
const clientDb = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId || '(default)');

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
  const normalizedSlug = slug.toLowerCase().trim();
  
  // Use a more robust env key mapping to match .env.example
  const keysToTry = [
    normalizedSlug.replace(/-/g, '_').replace('apartament_', '').toUpperCase(),
    normalizedSlug.replace(/-/g, '_').toUpperCase(),
    normalizedSlug.toUpperCase()
  ];
  
  // Map common aliases
  const mapping: Record<string, string> = {
    'apartament-premium-king': 'PREMIUM_KING',
    'apartament-deluxe-double': 'DELUXE_DOUBLE',
    'apartament-family-standard': 'FAMILY_STANDARD',
    'apartament-family-deluxe': 'FAMILY_DELUXE',
    'peraduo': 'PERADUO',
    'peraconfort': 'PERACONFORT',
    'pera-duo': 'PERADUO',
    'pera-confort': 'PERACONFORT',
    'premium-king': 'PREMIUM_KING',
    'deluxe-double': 'DELUXE_DOUBLE',
    'family-standard': 'FAMILY_STANDARD',
    'family-deluxe': 'FAMILY_DELUXE',
    'deluxe': 'DELUXE_DOUBLE', // fallback
    'standard': 'FAMILY_STANDARD' // fallback
  };
  
  if (mapping[normalizedSlug]) {
    keysToTry.unshift(mapping[normalizedSlug]);
  }

  let bookingUrl = '';
  let airbnbUrl = '';

  for (const k of keysToTry) {
    if (!bookingUrl) bookingUrl = process.env[`ICAL_BOOKING_${k}`] || '';
    if (!airbnbUrl) airbnbUrl = process.env[`ICAL_AIRBNB_${k}`] || '';
  }

  console.log(`[iCal Sync] Syncing ${normalizedSlug}. Booking: ${!!bookingUrl}, Airbnb: ${!!airbnbUrl}`);

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
    const normalizedSlug = slug.trim().toLowerCase();
    
    if (adminDb) {
      const snapshot = await adminDb.collection('manual_blocks').get();
      snapshot.forEach((doc: any) => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').trim().toLowerCase();
        
        const isMatch = blockAptId === normalizedSlug || 
                        normalizedSlug.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(normalizedSlug.replace(/-/g, ' '));

        if (isMatch && block.startDate && block.endDate) {
          try {
            const range = eachDayOfInterval({
              start: parseISO(block.startDate),
              end: parseISO(block.endDate)
            });
            manualDates = [...manualDates, ...range.map(d => format(d, 'yyyy-MM-dd'))];
          } catch (e) {}
        }
      });
    } else {
      // Fallback: Use client JS SDK (works in Node.js)
      const querySnapshot = await getDocs(collection(clientDb, 'manual_blocks'));
      querySnapshot.forEach((doc) => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').trim().toLowerCase();
        
        const isMatch = blockAptId === normalizedSlug || 
                        normalizedSlug.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(normalizedSlug.replace(/-/g, ' '));

        if (isMatch && block.startDate && block.endDate) {
          try {
            const range = eachDayOfInterval({
              start: parseISO(block.startDate),
              end: parseISO(block.endDate)
            });
            manualDates = [...manualDates, ...range.map(d => format(d, 'yyyy-MM-dd'))];
          } catch (e) {}
        }
      });
    }
  } catch (e: any) {
    console.error("[iCal Sync] Firestore manual_blocks query failed:", e.message);
  }

  // Merge and remove duplicates from all sources
  const allDates = new Set([...results[0], ...results[1], ...results[2], ...manualDates]);
  return Array.from(allDates);
}
