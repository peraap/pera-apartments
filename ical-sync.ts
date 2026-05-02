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
    console.log(`[iCal Fetch] Fetching from: ${url.substring(0, 70)}...`);
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (PeraApartments-Sync/1.0)' }
    });
    console.log(`[iCal Fetch] Success. Status: ${response.status}. Length: ${response.data.length}`);
    const data = ical.parseICS(response.data);
    const blockedDates: Set<string> = new Set();
    const today = startOfDay(new Date());

    let count = 0;
    for (const k in data) {
      if (data.hasOwnProperty(k)) {
        const ev = data[k];
        if (ev.type === 'VEVENT' && ev.start && ev.end) {
          const start = startOfDay(new Date(ev.start));
          const end = startOfDay(new Date(ev.end));

          // Only care about future or current bookings
          if (isAfter(end, today) || format(end, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            try {
              const range = eachDayOfInterval({
                start: start,
                end: end
              });
              
              // Exclude checkout day
              const days = range.length > 1 ? range.slice(0, -1) : range;

              days.forEach(day => {
                blockedDates.add(format(day, 'yyyy-MM-dd'));
              });
              count++;
            } catch (err) {
              console.warn(`[iCal Sync] Interval error for event:`, err);
            }
          }
        }
      }
    }
    console.log(`[iCal Fetch] Parsed ${count} future events. Unique blocked dates: ${blockedDates.size}`);
    return Array.from(blockedDates);
  } catch (error: any) {
    console.error(`Error fetching iCal from ${url}:`, error.message);
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

  // Fetch all in parallel
  const googleCalendarPromise = getBlockedDatesFromCalendar(slug);

  const results: string[][] = await Promise.all([
    bookingUrl ? getBlockedDatesFromIcal(bookingUrl) : Promise.resolve([]),
    airbnbUrl ? getBlockedDatesFromIcal(airbnbUrl) : Promise.resolve([]),
    googleCalendarPromise
  ]);

  const bDates = results[0];
  const aDates = results[1];
  const gDates = results[2];

  console.log(`[iCal Sync] ${normalizedSlug} Results - Booking: ${bDates.length}, Airbnb: ${aDates.length}, Google: ${gDates.length}`);

  // 3. Check manual blocks in Firestore
  let manualDates: string[] = [];
  try {
    const normalizedSlugForManual = slug.trim().toLowerCase();
    let snapshot: any = null;
    
    // Try Admin SDK first
    if (adminDb) {
      try {
        snapshot = await adminDb.collection('manual_blocks').get();
        console.log(`[iCal Sync] Fetched ${snapshot.size} manual blocks via Admin SDK`);
      } catch (adminErr: any) {
        if (adminErr.message?.includes('PERMISSION_DENIED')) {
          console.warn("[iCal Sync] Admin SDK restricted (Permission Denied). Using failover Client SDK.");
        } else {
          console.warn("[iCal Sync] Admin SDK failed, falling back to Client SDK:", adminErr.message);
        }
        snapshot = null; 
      }
    }
    
    // If Admin SDK failed or is missing, use Client SDK
    if (!snapshot) {
      const querySnapshot = await getDocs(collection(clientDb, 'manual_blocks'));
      console.log(`[iCal Sync] Fetched ${querySnapshot.size} manual blocks via Client SDK`);
      
      querySnapshot.forEach((doc) => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').trim().toLowerCase();
        const isMatch = blockAptId === normalizedSlugForManual || 
                        normalizedSlugForManual.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(normalizedSlugForManual.replace(/-/g, ' '));

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
      // Process Admin SDK snapshot
      snapshot.forEach((doc: any) => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').trim().toLowerCase();
        const isMatch = blockAptId === normalizedSlugForManual || 
                        normalizedSlugForManual.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(normalizedSlugForManual.replace(/-/g, ' '));

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
