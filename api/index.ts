import express from "express";
import Stripe from "stripe";
import cors from "cors";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import ical, { ICalCalendarMethod, ICalEventBusyStatus } from "ical-generator";
import admin from "firebase-admin";
import axios from "axios";
import icalParser from "node-ical";
import { google } from "googleapis";

const firebaseConfig = {
  "projectId": "gen-lang-client-0517351691",
  "appId": "1:878798025255:web:a80add1ae3e302e5dc9402",
  "apiKey": "AIzaSyA5mfW-S0gN29Kys4r_rDmn_78eIpOn9VE",
  "authDomain": "gen-lang-client-0517351691.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-f4227c81-cc11-4beb-bdb1-e70aa33734a0",
  "storageBucket": "gen-lang-client-0517351691.firebasestorage.app",
  "messagingSenderId": "878798025255",
  "measurementId": ""
};

const app = express();

// Maintenance Mode Middleware for Vercel
app.use((req, res, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'; 
  const isPublicApi = req.path.startsWith('/api/health') || 
                      req.path.includes('export-ical') ||
                      req.path.includes('api/ical') ||
                      req.path.includes('api/sync-calendars') ||
                      req.path.includes('.ics');
  
  if (isMaintenance && !isPublicApi) {
    return res.status(503).json({ error: "Sistemul este în mentenanță." });
  }
  next();
});

// Initialize Firebase Client SDK
let firebaseApp: any;
let db: any;

try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Initialize Firebase Admin SDK for Vercel
let adminDb: any;
try {
  if (admin.apps.length === 0) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: serviceAccountEmail,
          privateKey: privateKey,
        })
      });
      const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
      if (dbId === '(default)') {
        adminDb = admin.firestore();
      } else {
        // @ts-ignore
        adminDb = admin.firestore(dbId);
      }
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization failed in Vercel API:", error);
}

const handleIcalExportInternal = async (req: any, res: any) => {
  try {
    let slug = req.params.slug || req.params[0] || req.path.split('/').pop();
    
    // Handle Vercel rewrite oddities
    if (slug === 'ical' || slug === 'export-ical' || !slug) {
       const parts = req.path.split('/');
       slug = parts[parts.length - 1];
    }

    if (slug && slug.toLowerCase().endsWith('.ics')) {
      slug = slug.substring(0, slug.length - 4);
    }
    
    if (!slug || slug === 'ical' || slug === 'export-ical') {
       slug = req.query.slug as string;
    }

    if (!slug) {
      return res.status(400).send("Slug required. Use /api/ical/room-name.ics");
    }

    console.log(`[iCal Vercel] Exporting for slug: ${slug}`);

    const calendar = ical({ 
      name: `Pera Apartments - ${slug}`,
      prodId: { company: 'Pera Apartments', product: 'Booking Sync', language: 'RO' },
      method: ICalCalendarMethod.PUBLISH
    });

    if (adminDb || db) {
      let querySnapshot;
      let manualBlocksSnapshot;
      try {
        if (adminDb) {
          querySnapshot = await adminDb.collection('bookings')
            .where('status', 'in', ['paid', 'confirmed', 'succeeded'])
            .get();
            
          manualBlocksSnapshot = await adminDb.collection('manual_blocks').get();
        } else {
          const q = query(collection(db, 'bookings'), where('status', 'in', ['paid', 'confirmed', 'succeeded']));
          querySnapshot = await getDocs(q);
          
          const mq = query(collection(db, 'manual_blocks'));
          manualBlocksSnapshot = await getDocs(mq);
        }
      } catch (fetchError: any) {
        console.error("[iCal Export Vercel] Fetch failed:", fetchError.message);
        querySnapshot = { forEach: () => {} };
        manualBlocksSnapshot = { forEach: () => {} };
      }
      
      let hasEvents = false;
      const searchSlug = slug.toLowerCase();
      const searchName = searchSlug.replace(/-/g, ' ');

      const slugAliases: Record<string, string[]> = {
        'premium-king': ['1', 'apartament-premium-king', 'camera king', 'king room', 'king-room', 'premium-king'],
        'deluxe-double': ['2', 'apartament-deluxe-double', 'camera dubla deluxe', 'deluxe double', 'deluxe-double'],
        'family-deluxe': ['3', 'apartament-family-deluxe', 'camera de familie deluxe', 'family deluxe', 'family-deluxe'],
        'family-standard': ['4', 'apartament-family-standard', 'camera de familie standard', 'family standard', 'family-standard'],
        'peraduo': ['5', 'pera-duo', 'peraduo'],
        'peraconfort': ['6', 'pera-confort', 'peraconfort']
      };
      
      const aliases = slugAliases[searchSlug] || [];

      // Process real bookings
      querySnapshot.forEach((doc: any) => {
        const booking = doc.data();
        const aptName = (booking.apartmentName || '').toLowerCase();
        const aptId = (booking.apartmentId || '').toLowerCase();

        const isDirectIdMatch = aptId === searchSlug || aliases.includes(aptId);
        const isNameMatch = aptName.includes(searchName) || aliases.some(alias => aptName.includes(alias));
        const isShortNameMatch = booking.shortName && booking.shortName.toLowerCase() === searchSlug;
        
        if ((isDirectIdMatch || isNameMatch || isShortNameMatch) && booking.checkIn && booking.checkOut) {
          hasEvents = true;
          calendar.createEvent({
            id: doc.id,
            start: new Date(booking.checkIn),
            end: new Date(booking.checkOut),
            allDay: true,
            summary: 'Site Rezervare',
            description: `Oaspete: ${booking.guestName}`,
            busystatus: ICalEventBusyStatus.BUSY
          });
        }
      });

      // Process manual blocks
      manualBlocksSnapshot.forEach((doc: any) => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').toLowerCase();
        
        const isMatch = blockAptId === searchSlug || 
                        aliases.includes(blockAptId) ||
                        searchSlug.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(searchSlug.replace(/-/g, ' '));

        if (isMatch && block.startDate && block.endDate) {
          hasEvents = true;
          calendar.createEvent({
            id: `manual-${doc.id}`,
            start: new Date(block.startDate),
            end: new Date(block.endDate),
            allDay: true,
            summary: block.reason || 'Site Blocat',
            description: 'Blocare manuală din panoul de administrare.',
            busystatus: ICalEventBusyStatus.BUSY
          });
        }
      });

      // ADDED: Fetch and include events from Google Calendar in the iCal export
      try {
        const authClient = getVercelGoogleAuth();
        const gCalId = getVercelCalendarId(slug);
        if (authClient && gCalId && gCalId !== 'primary') {
          const googleCal = google.calendar({ version: 'v3', auth: authClient });
          const gRes = await googleCal.events.list({
            calendarId: gCalId,
            timeMin: new Date().toISOString(),
            singleEvents: true,
            maxResults: 50
          });

          (gRes.data.items || []).forEach((gEvent: any) => {
            const start = gEvent.start?.date || gEvent.start?.dateTime;
            const end = gEvent.end?.date || gEvent.end?.dateTime;
            
            if (start && end) {
              hasEvents = true;
              calendar.createEvent({
                id: `google-${gEvent.id}`,
                start: new Date(start),
                end: new Date(end),
                summary: gEvent.summary || 'Rezervare / Blocat',
                description: 'Sincronizat din Google Calendar.',
                busystatus: ICalEventBusyStatus.BUSY
              });
            }
          });
        }
      } catch (gErr: any) {
        console.error(`[iCal Export] Could not fetch Google events for export: ${gErr.message}`);
      }

      if (!hasEvents) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        calendar.createEvent({
          id: `sync-active-${slug}`,
          start: startDate,
          end: endDate,
          allDay: true,
          summary: 'Calendar Sync Active (Pera Apartments)',
          description: 'Conexiune activă pentru sincronizarea calendarului. Nu există rezervări momentan.',
          busystatus: ICalEventBusyStatus.BUSY
        });
      }
    }

    const output = calendar.toString();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.ics"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(output);
  } catch (error: any) {
    console.error("[iCal Export Vercel] Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

app.get("/api/health", (req, res) => {
  const auth = getVercelGoogleAuth();
  res.json({ 
    status: "ok", 
    vercel: true,
    maintenance: process.env.MAINTENANCE_MODE === 'true',
    stripeKey: !!process.env.STRIPE_SECRET_KEY,
    gmailUser: !!process.env.GMAIL_USER,
    gmailPass: !!process.env.GMAIL_APP_PASSWORD,
    adminDbInitialized: !!adminDb,
    dbInitialized: !!db,
    googleAuthInitialized: !!auth, // New check
    nodeEnv: process.env.NODE_ENV
  });
});

const getVercelGoogleAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    console.error("[Vercel Auth] Missing email or private key");
    return null;
  }

  // Robust key scrubbing
  try {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // Ensure it has the headers if they were lost
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
       // This is risky but sometimes needed if user only pasted the middle part
       // But usually we expect the full key.
    }

    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  } catch (err: any) {
    console.error("[Vercel Auth] JWT Init Error:", err.message);
    return null;
  }
};

const getVercelCalendarId = (slug: string) => {
  const mapping: Record<string, string> = {
    'apartament-premium-king': 'KING',
    'premium-king': 'KING',
    'apartament-deluxe-double': 'DUBLA_DELUXE',
    'deluxe-double': 'DUBLA_DELUXE',
    'apartament-family-standard': 'FAMILIE',
    'family-standard': 'FAMILIE',
    'apartament-family-deluxe': 'FAMILIE_DELUXE',
    'family-deluxe': 'FAMILIE_DELUXE',
    'apartament-peraduo': 'PERADUO',
    'peraduo': 'PERADUO',
    'apartament-peraconfort': 'PERACONFORT',
    'peraconfort': 'PERACONFORT'
  };

  const lowerSlug = slug.toLowerCase().trim();
  const keyMapped = mapping[lowerSlug];
  
  // Normalize names
  const cleanName = lowerSlug.replace('apartament-', '').replace(/-/g, '_').toUpperCase();
  const rawKey = lowerSlug.replace(/-/g, '_').toUpperCase();
  const simpleName = lowerSlug.replace('apartament-', '').toUpperCase();

  console.log(`[Vercel Auth] Search for ${slug} (Mapped: ${keyMapped}, Clean: ${cleanName})`);

  // 1. Check JSON first
  if (process.env.GOOGLE_CALENDAR_IDS_JSON) {
    try {
      const idsMap = JSON.parse(process.env.GOOGLE_CALENDAR_IDS_JSON.trim());
      const keysToTry = [keyMapped, cleanName, simpleName, rawKey, lowerSlug.toUpperCase(), lowerSlug];
      
      // Step 1: Direct match
      for (const k of keysToTry) {
        if (k && idsMap[k]) return idsMap[k];
      }

      // Step 2: Case-insensitive deep search
      const jsonKeys = Object.keys(idsMap);
      for (const cand of keysToTry) {
        if (!cand) continue;
        const found = jsonKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (found) return idsMap[found];
      }
      
      // Step 3: Partial match if desperate
      const foundPartial = jsonKeys.find(k => k.toLowerCase().includes(simpleName.toLowerCase()) || simpleName.toLowerCase().includes(k.toLowerCase()));
      if (foundPartial && simpleName.length > 3) return idsMap[foundPartial];

    } catch (e: any) {
      console.error("[Vercel Auth] JSON Error:", e.message);
    }
  }

  // 2. Check individual variables
  const keysToTryEnv = [keyMapped, cleanName, simpleName, rawKey].filter(Boolean) as string[];
  for (const k of keysToTryEnv) {
    const val = process.env[`GOOGLE_CALENDAR_ID_${k}`];
    if (val) return val;
  }

  return 'primary';
};

async function syncToGoogleInternal(slug: string, url: string, sourceName: string, sessionDates?: Set<string>) {
  const auth = getVercelGoogleAuth();
  if (!auth) throw new Error("Auth initialization failed");
  
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = getVercelCalendarId(slug);
  if (calendarId === 'primary') throw new Error(`Specific calendar ID not found for ${slug}`);

  const response = await axios.get(url, { timeout: 10000 });
  const data = icalParser.parseICS(response.data);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const res = await calendar.events.list({
    calendarId,
    timeMin: today.toISOString(),
    singleEvents: true,
    maxResults: 100
  });
  
  const existingEvents = res.data.items || [];
  const existingKeys = new Set();
  const existingDates = new Set(); // New: Track blocked dates to prevent source duplicates

  existingEvents.forEach((e: any) => {
    const uidMatch = e.description?.match(/UID iCal: (.+)/);
    if (uidMatch) existingKeys.add(uidMatch[1].trim());
    
    const start = e.start?.date || (e.start?.dateTime ? e.start.dateTime.split('T')[0] : '');
    const end = e.end?.date || (e.end?.dateTime ? e.end.dateTime.split('T')[0] : '');
    
    if (start && end) {
      existingKeys.add(`${e.summary?.toLowerCase()}-${start}-${end}`);
      // If it looks like a synced reservation, track the dates
      if (e.summary?.toLowerCase().includes('rezervare') || e.description?.includes('Sincronizat')) {
        existingDates.add(`${start}-${end}`);
      }
    }
  });

  let added = 0;
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
      
      // If we are syncing Airbnb, but it contains Booking.com or other external reservations
      if (sourceName === 'Airbnb') {
        // Pattern 1: Explicit labels
        const isBookingSearch = icalSummary.includes('booking.com') || icalDescription.includes('booking.com') || icalSummary.includes('booking-') || icalSummary.startsWith('booking') || icalSummary.includes('reservation - booking') || icalSummary.includes('b.com');
        const isExpediaSearch = icalSummary.includes('expedia') || icalDescription.includes('expedia');
        
        // Pattern 2: Airbnb often shows imported events simply as "Reserved" (summary) with no "Airbnb" in it
        // real Airbnb events usually have "Airbnb (Not available)" or "Reservation (Person Name)"
        // If it starts with "Reservation" but doesn't mention Airbnb, it's likely Booking
        const isLikelyBooking = (icalSummary.startsWith('reservation') && !icalDescription.includes('airbnb')) || (icalSummary === 'reserved' && !icalDescription.includes('airbnb'));
        const isGenericReserved = (icalSummary === 'reserved' || icalSummary === 'unavailable') && !icalDescription.includes('airbnb');
        const isExpediaLabel = icalSummary.includes('expedia') || icalDescription.includes('expedia');

        if (isBookingSearch || isLikelyBooking) {
          effectiveSource = 'Booking';
        } else if (isExpediaSearch || isExpediaLabel) {
          effectiveSource = 'Expedia';
        } else if (icalSummary.includes('airbnb') || icalDescription.includes('airbnb')) {
          effectiveSource = 'Airbnb';
        } else {
          effectiveSource = 'Airbnb'; // Default to Airbnb if we're scanning an Airbnb feed
        }
      } else if (sourceName.toLowerCase().includes('booking')) {
        effectiveSource = 'Booking';
      } else if (sourceName.toLowerCase().includes('airbnb')) {
        effectiveSource = 'Airbnb';
      }

      let summary = `${effectiveSource} Rezervare`;
      if (icalSummary.includes('closed') || icalSummary.includes('blocked') || icalSummary.includes('blocat') || icalSummary.includes('inchis') || icalSummary.includes('unavailable') || icalSummary.includes('not available')) {
        summary = `${effectiveSource} Blocat`;
      }
      
      const eventKey = `${summary.toLowerCase()}-${startDateStr}-${endDateStr}`;
      const dateKey = `${startDateStr}-${endDateStr}`;
      const uid = (ev.uid || `${eventKey}-${k}`).toString().trim();

      const isAlreadyInGoogle = existingKeys.has(uid) || existingKeys.has(eventKey) || existingDates.has(dateKey);
      const isAlreadyAddedInThisSession = sessionDates?.has(`${slug}-${dateKey}`);

      if (!isAlreadyInGoogle && !isAlreadyAddedInThisSession) {
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary,
            description: `Sincronizat automat din ${sourceName}.\nUID iCal: ${uid}`,
            start: { date: startDateStr },
            end: { date: endDateStr },
            transparency: 'opaque',
            colorId: effectiveSource === 'Airbnb' ? '11' : (effectiveSource.includes('Extern') || effectiveSource.includes('Sync') ? '8' : '1'),
          }
        });
        existingKeys.add(uid);
        existingKeys.add(eventKey);
        if (sessionDates) sessionDates.add(`${slug}-${dateKey}`);
        added++;
        if (added >= 100) break; // Safety limit for Vercel
      }
    }
  }
  return added;
}

async function syncInternalFirestoreToGoogle(slug: string, sessionDates: Set<string>) {
  const auth = getVercelGoogleAuth();
  if (!auth) return 0;
  const calendarId = getVercelCalendarId(slug);
  if (!calendarId || calendarId === 'primary') return 0;
  
  const calendar = google.calendar({ version: 'v3', auth });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch current Google events to avoid duplicates
  const res = await calendar.events.list({
    calendarId,
    timeMin: today.toISOString(),
    singleEvents: true,
    maxResults: 250
  });
  const existingKeys = new Set();
  const existingDates = new Set();
  (res.data.items || []).forEach((e: any) => {
    const start = e.start?.date || e.start?.dateTime?.split('T')[0];
    const end = e.end?.date || e.end?.dateTime?.split('T')[0];
    if (start && end) {
      existingKeys.add(`${e.summary?.toLowerCase()}-${start}-${end}`);
      existingDates.add(`${start}-${end}`);
    }
  });

  let addedCount = 0;
  const normalizedSlug = slug.toLowerCase();

  // 1. Blocks from Firestore
  const qBlocks = query(collection(db, "manual_blocks"));
  const blocksSnap = await getDocs(qBlocks);
  for (const docObj of blocksSnap.docs) {
    const b = docObj.data();
    const aptId = (b.apartmentId || '').toLowerCase();
    const isUniversal = aptId === 'all' || aptId === 'toate';
    if ((aptId === normalizedSlug || isUniversal) && b.startDate && b.endDate) {
      const startStr = b.startDate.split('T')[0];
      const endStr = b.endDate.split('T')[0];
      const summary = b.reason ? `ÎNCHIS: ${b.reason}` : 'ÎNCHIS / BLOCAT ADMIN';
      const eventKey = `${summary.toLowerCase()}-${startStr}-${endStr}`;
      const dateKey = `${startStr}-${endStr}`;

      if (!existingKeys.has(eventKey) && !existingDates.has(dateKey) && !sessionDates.has(`${slug}-${dateKey}`)) {
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary,
            description: `Blocare manuală din Pera Site-Admin.\nID: ${docObj.id}`,
            start: { date: startStr },
            end: { date: endStr },
            colorId: '8' // Grey
          }
        });
        sessionDates.add(`${slug}-${dateKey}`);
        addedCount++;
      }
    }
  }

  // 2. Bookings from Firestore
  const qBookings = query(collection(db, "bookings"), where("status", "in", ["confirmed", "paid"]));
  const bookingsSnap = await getDocs(qBookings);
  for (const docObj of bookingsSnap.docs) {
    const b = docObj.data();
    const aptId = (b.apartmentId || '').toLowerCase();
    if (aptId === normalizedSlug && b.checkIn && b.checkOut) {
      const startStr = b.checkIn;
      const endStr = b.checkOut;
      const summary = `Site Rezervare`;
      const eventKey = `${summary.toLowerCase()}-${startStr}-${endStr}`;
      const dateKey = `${startStr}-${endStr}`;

      if (!existingKeys.has(eventKey) && !existingDates.has(dateKey) && !sessionDates.has(`${slug}-${dateKey}`)) {
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary,
            description: `Rezervare site Pera Apartments.\nOaspete: ${b.guestName}\nTotal: ${b.totalPrice} RON`,
            start: { date: startStr },
            end: { date: endStr },
            colorId: '2' // Sage (Site)
          }
        });
        sessionDates.add(`${slug}-${dateKey}`);
        addedCount++;
      }
    }
  }

  return addedCount;
}

app.get("/api/sync-calendars", async (req, res) => {
  const targetSlug = req.query.slug as string;
  const targetSource = req.query.source as string; // airbnb or booking
  
  try {
    const apartments = [
      'premium-king',
      'apartament-premium-king',
      'deluxe-double',
      'apartament-deluxe-double',
      'family-standard',
      'apartament-family-standard',
      'family-deluxe',
      'apartament-family-deluxe',
      'peraduo',
      'apartament-peraduo',
      'peraconfort',
      'apartament-peraconfort'
    ];

    const results: any[] = [];
    const targetSlugLower = targetSlug ? targetSlug.toLowerCase() : null;
    let syncApartments = targetSlugLower ? [targetSlugLower] : [apartments[0]];
    
    if (req.query.all) {
      syncApartments = apartments;
    }

    console.log(`[Vercel Sync] Starting sync for: ${syncApartments.join(', ')}`);
    const sessionAddedDates = new Set<string>();

    for (const slug of syncApartments) {
      const isKnown = apartments.includes(slug);
      if (!isKnown) {
        results.push({ slug, status: "ignored (invalid slug name)" });
        continue;
      }

      // Base name for ENV lookup: "apartament-peraduo" -> "PERADUO"
      const baseName = slug.replace('apartament-', '').replace(/-/g, '_').toUpperCase();
      const bookingUrl = process.env[`ICAL_BOOKING_${baseName}`];
      const airbnbUrl = process.env[`ICAL_AIRBNB_${baseName}`];

      // BASE PRIORITY: Sync Booking FIRST because Airbnb iCal often includes imported Booking events
      if (bookingUrl && (!targetSource || targetSource.toLowerCase() === 'booking')) {
        try {
          const added = await syncToGoogleInternal(slug, bookingUrl, 'Booking.com', sessionAddedDates);
          results.push({ slug, source: 'Booking', status: 'success', added });
        } catch (err: any) {
          results.push({ slug, source: 'Booking', status: 'error', message: err.message });
        }
      }
      
      if (airbnbUrl && (!targetSource || targetSource.toLowerCase() === 'airbnb')) {
        try {
          const added = await syncToGoogleInternal(slug, airbnbUrl, 'Airbnb', sessionAddedDates);
          results.push({ slug, source: 'Airbnb', status: 'success', added });
        } catch (err: any) {
          results.push({ slug, source: 'Airbnb', status: 'error', message: err.message });
        }
      }

      // Also sync site-internal bookings and manual blocks TO Google
      try {
        const added = await syncInternalFirestoreToGoogle(slug, sessionAddedDates);
        results.push({ slug, source: 'Site-Internal', status: 'success', added });
      } catch (err: any) {
        console.error(`[Vercel Sync] Firestore -> Google error for ${slug}:`, err.message);
      }
    }
    
    res.json({ 
      status: "Sync attempt finished", 
      results,
      note: !targetSlug ? "Only synced first apartment to avoid Vercel timeout. Pass ?slug=NAME for others." : "Individual sync"
    });
  } catch (error: any) {
    console.error(`[Vercel Sync] Critical Error:`, error.message);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get("/api/blocked-dates/:slug", async (req, res) => {
  const slug = req.params.slug;
  // Use same robust normalization
  const baseName = slug.toLowerCase().replace('apartament-', '').replace(/-/g, '_').toUpperCase();
  
  const bookingUrl = process.env[`ICAL_BOOKING_${baseName}`];
  const airbnbUrl = process.env[`ICAL_AIRBNB_${baseName}`];

  console.log(`[Vercel API] Fetching blocked dates for ${slug}. BaseName: ${baseName}`);

  const fetchIcal = async (url: string) => {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = icalParser.parseICS(response.data);
      const blockedDates: Set<string> = new Set();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const k in data) {
        const ev = data[k];
        if (ev.type === 'VEVENT' && ev.start && ev.end) {
          const start = new Date(ev.start);
          const end = new Date(ev.end);
          if (end >= today) {
            const current = new Date(start);
            while (current <= end) {
              blockedDates.add(current.toISOString().split('T')[0]);
              current.setDate(current.getDate() + 1);
            }
          }
        }
      }
      return Array.from(blockedDates);
    } catch (e: any) {
      console.error(`[Vercel API] iCal Error for ${url}:`, e.message);
      return [];
    }
  };

  const getGoogleCalendarDates = async () => {
    try {
      const auth = getVercelGoogleAuth();
      if (!auth) return [];
      const calendarId = getVercelCalendarId(slug);
      if (!calendarId || calendarId === 'primary') return [];

      const calendar = google.calendar({ version: 'v3', auth });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await calendar.events.list({
        calendarId,
        timeMin: today.toISOString(),
        singleEvents: true,
        maxResults: 250
      });

      const dates: Set<string> = new Set();
      (response.data.items || []).forEach(event => {
        const startStr = event.start?.date || event.start?.dateTime?.split('T')[0];
        const endStr = event.end?.date || event.end?.dateTime?.split('T')[0];
        if (startStr && endStr) {
          let current = new Date(startStr);
          const end = new Date(endStr);
          while (current < end) {
            dates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      });
      return Array.from(dates);
    } catch (e: any) {
      console.error(`[Vercel API] Google Calendar Error for ${slug}:`, e.message);
      return [];
    }
  };

  // Get manual blocks from Firestore
  const getManualBlocks = async () => {
    const dates: Set<string> = new Set();
    try {
      const normalizedSlug = slug.trim().toLowerCase();
      const q = query(collection(db, "manual_blocks"));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(doc => {
        const block = doc.data();
        const blockAptId = (block.apartmentId || '').trim().toLowerCase();
        
        const isMatch = blockAptId === normalizedSlug || 
                        normalizedSlug.includes(blockAptId.replace(/ /g, '-')) ||
                        blockAptId.includes(normalizedSlug.replace(/-/g, ' '));
        
        if (isMatch && block.startDate && block.endDate) {
          const start = new Date(block.startDate);
          const end = new Date(block.endDate);
          let current = new Date(start);
          while (current <= end) {
            dates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      });
    } catch (e: any) {
      console.error("[Vercel API] Manual Blocks Error:", e.message);
    }
    return Array.from(dates);
  };

  try {
    const [bookingDates, airbnbDates, googleDates, manualDates] = await Promise.all([
      bookingUrl ? fetchIcal(bookingUrl) : Promise.resolve([]),
      airbnbUrl ? fetchIcal(airbnbUrl) : Promise.resolve([]),
      getGoogleCalendarDates(),
      getManualBlocks()
    ]);

    const allDates = new Set([...bookingDates, ...airbnbDates, ...googleDates, ...manualDates]);
    res.json({ blockedDates: Array.from(allDates) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/apartments/:slug/blocked-dates", async (req, res) => {
  // Alias for backward compatibility or future use
  res.redirect(301, `/api/blocked-dates/${req.params.slug}`);
});

// Improved route matching
app.get("/api/ical*", handleIcalExportInternal);
app.get("/api/export-ical*", handleIcalExportInternal);
app.get("/export-ical*", handleIcalExportInternal);

let stripe: Stripe;

try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
} catch (error) {
  console.error("Stripe initialization failed:", error);
}

let transporter: any;

try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'contact.peraapartments@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
} catch (error) {
  console.error("Nodemailer initialization failed:", error);
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Webhook needs raw body for signature verification
app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!stripe) {
      throw new Error("Stripe is not initialized");
    }
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is missing");
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Save booking to Firestore and send confirmation email
    try {
      const metadata = session.metadata;
      if (metadata) {
        // 1. Save to Firestore
        if (db) {
          await addDoc(collection(db, 'bookings'), {
            apartmentId: metadata.apartmentId,
            apartmentName: metadata.apartmentName || 'Apartament Pera',
            checkIn: metadata.checkIn,
            checkOut: metadata.checkOut,
            guestName: metadata.guestName,
            guestEmail: metadata.guestEmail,
            totalPrice: parseFloat(metadata.totalPrice),
            status: 'confirmed',
            paymentIntentId: session.payment_intent as string,
            stripeSessionId: session.id,
            createdAt: new Date().toISOString(),
            source: 'stripe_webhook'
          });
          console.log(`Booking saved for session ${session.id}`);
        } else {
          console.error("Firestore database is not initialized. Booking not saved.");
        }

        // 2. Send Confirmation Email
        const recipients = ['contact.peraapartments@gmail.com', 'petreandrei1979@gmail.com'];
        if (metadata.guestEmail) {
          recipients.push(metadata.guestEmail);
        }

        console.log(`[Webhook] Attempting to send confirmation email to: ${recipients.join(', ')}`);
        
        try {
          if (!transporter) {
            throw new Error("Transporter is not initialized");
          }
          await transporter.sendMail({
            from: `"Pera Apartments" <${process.env.GMAIL_USER || 'contact.peraapartments@gmail.com'}>`,
            to: recipients,
            subject: 'Confirmare Rezervare - Pera Apartments',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #000;">Rezervare Nouă Confirmată!</h2>
                <p>Salut, <strong>${metadata.guestName || 'Oaspete'}</strong>,</p>
                <p>Plata pentru rezervarea la <strong>Pera Apartments</strong> a fost procesată cu succes.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">Detalii Rezervare:</h3>
                  <p><strong>Apartament:</strong> ${metadata.apartmentName || 'Apartament Pera'}</p>
                  <p><strong>Check-in:</strong> ${metadata.checkIn}</p>
                  <p><strong>Check-out:</strong> ${metadata.checkOut}</p>
                  <p><strong>Total Plătit:</strong> ${metadata.totalPrice} RON</p>
                  <p><strong>Email Client:</strong> ${metadata.guestEmail || 'Nespecificat'}</p>
                </div>
                
                <p>Te așteptăm cu drag! Dacă ai întrebări, ne poți contacta la acest email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Pera Apartments - Cristian, Brașov</p>
              </div>
            `,
          });
          console.log("[Webhook] Confirmation email sent successfully via Gmail.");
        } catch (emailError) {
          console.error("[Webhook] Gmail Error during payment confirmation:", emailError);
        }
      }
    } catch (error) {
      console.error("Error in webhook processing (DB or Email):", error);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

// API ROUTES
  app.post("/api/send-discount-email", async (req, res) => {
  console.log(`[${new Date().toISOString()}] Attempting to send discount email to: ${req.body.email}`);
  try {
    const { email, name } = req.body;

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error("CRITICAL ERROR: GMAIL_APP_PASSWORD is missing in environment variables!");
      return res.status(500).json({ error: "Configurația de email lipsește pe server." });
    }

    if (!transporter) {
      throw new Error("Transporter is not initialized");
    }
    await transporter.sendMail({
      from: `"Pera Apartments" <${process.env.GMAIL_USER || 'contact.peraapartments@gmail.com'}>`,
      to: email,
      subject: 'Codul tău de reducere 20% - Pera Apartments',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">Salut, ${name}!</h2>
          <p>Mulțumim pentru interesul acordat <strong>Pera Apartments</strong>.</p>
          <p>Așa cum am promis, iată codul tău de reducere pentru următoarea rezervare:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 5px;">
            PASTE20
          </div>
          <p>Folosește acest cod la finalizarea rezervării pe site-ul nostru pentru a beneficia de <strong>20% reducere</strong>.</p>
          <p>Te așteptăm cu drag!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Oferta este valabilă până pe 15 aprilie 2026.</p>
        </div>
      `,
    });

    console.log("Discount email sent successfully via Gmail.");
    res.json({ success: true });
  } catch (error: any) {
    console.error("Server Exception during email send:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { apartmentId, apartmentName, totalPrice, checkIn, checkOut, guestEmail, guestName } = req.body;

    // Validation: Check-in must be before check-out
    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: "Data check-out trebuie să fie după data check-in." });
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      return res.status(500).json({ error: "Configurația Stripe lipsește (STRIPE_SECRET_KEY)." });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const origin = `${protocol}://${host}`;

    if (!stripe) {
      throw new Error("Stripe is not initialized");
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Rezervare ${apartmentName}`,
              description: `Perioada: ${checkIn} - ${checkOut}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/apartamente/${apartmentId}`,
      customer_email: guestEmail || undefined,
      metadata: {
        apartmentId,
        apartmentName,
        checkIn,
        checkOut,
        guestName,
        guestEmail,
        totalPrice: totalPrice.toString(),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message || "Eroare Stripe." });
  }
});

app.post("/api/verify-booking", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID missing" });
    if (!stripe) {
      throw new Error("Stripe is not initialized");
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ 
      status: session.payment_status === "paid" ? "success" : "pending", 
      metadata: session.metadata 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/send-confirmation-email", async (req, res) => {
  try {
    const { metadata } = req.body;
    if (!metadata || !metadata.guestEmail) {
      return res.status(400).json({ error: "Date insuficiente pentru email." });
    }

    const recipients = ['contact.peraapartments@gmail.com', 'petreandrei1979@gmail.com', metadata.guestEmail];
    
    if (!transporter) {
      throw new Error("Transporter is not initialized");
    }
    await transporter.sendMail({
      from: `"Pera Apartments" <${process.env.GMAIL_USER || 'contact.peraapartments@gmail.com'}>`,
      to: recipients,
      subject: 'Confirmare Rezervare - Pera Apartments',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">Rezervare Confirmată!</h2>
          <p>Salut, <strong>${metadata.guestName || 'Oaspete'}</strong>,</p>
          <p>Rezervarea ta la <strong>Pera Apartments</strong> a fost confirmată.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detalii Rezervare:</h3>
            <p><strong>Apartament:</strong> ${metadata.apartmentName || 'Apartament Pera'}</p>
            <p><strong>Check-in:</strong> ${metadata.checkIn}</p>
            <p><strong>Check-out:</strong> ${metadata.checkOut}</p>
            <p><strong>Total:</strong> ${metadata.totalPrice} RON</p>
          </div>
          
          <p>Te așteptăm cu drag!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Pera Apartments - Cristian, Brașov</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error sending manual confirmation:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
