import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, query, where, getDocs, collection, addDoc } from "firebase/firestore";
import { firebaseConfig } from "./src/firebase-config";
import { logBookingToSheet, logLoginToSheet, getSheetsAuth, logLeadToSheet } from "./google-sheets-storage";
import { addBookingToCalendar, syncExternalIcalToGoogle } from "./google-calendar-service";
import { getApartmentBlockedDates } from "./ical-sync";
import ical, { ICalCalendarMethod, ICalEventBusyStatus } from "ical-generator";
import { google } from "googleapis";
import admin from "firebase-admin";
import { adminDb } from "./firebase-admin-service";
import { eachDayOfInterval, format, parseISO } from "date-fns";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Client SDK
let firebaseApp: any;
let db: any;

try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (error) {
  console.error("Firebase client initialization failed:", error);
}

// Firebase Admin SDK is now initialized in firebase-admin-service.ts

let stripe: Stripe;

try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
} catch (error) {
  console.error("Stripe initialization failed:", error);
}

// Nodemailer Transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'contact.peraapartments@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

console.log("Stripe Secret Key present:", !!process.env.STRIPE_SECRET_KEY);
console.log("Gmail User present:", !!process.env.GMAIL_USER);
console.log("Gmail App Password present:", !!process.env.GMAIL_APP_PASSWORD);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Maintenance Mode Middleware - CRITICAL: Must be at the very top
  app.use((req, res, next) => {
    // Default to false unless explicitly set to true
    const isMaintenance = process.env.MAINTENANCE_MODE === 'true'; 
    const isPublicApi = req.path.startsWith('/api/health') || 
                        req.path.includes('export-ical') ||
                        req.path.includes('api/ical') ||
                        req.path.includes('.ics');
    
    if (isMaintenance && !isPublicApi) {
      if (req.path.startsWith('/api/')) {
        return res.status(503).json({ error: "Site-ul este în mentenanță." });
      }
      
      return res.send(`
        <!DOCTYPE html>
        <html lang="ro">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mentenanță - Pera Apartments</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
            </style>
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div class="mb-6 inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Site în mentenanță</h1>
                <p class="text-gray-600 mb-8">
                    Sistemul de rezervări este temporar oprit pentru actualizări. Ne cerem scuze pentru inconvenient!
                </p>
                <div class="pt-6 border-t border-gray-100 text-sm text-gray-400">
                    Vom reveni curând.
                </div>
            </div>
        </body>
        </html>
      `);
    }
    next();
  });

  app.use(express.json());

  // 1. Static Validation & Higher Priority Public Routes
  const handleIcalExport = async (req: any, res: any) => {
    try {
      let slug = req.params.slug || req.params[0];
      if (slug && slug.startsWith('/')) slug = slug.substring(1);
      
      console.log(`[iCal Export Request] Raw slug from params: ${slug}`);
      
      if (slug && slug.toLowerCase().endsWith('.ics')) {
        slug = slug.substring(0, slug.length - 4);
      }
      
      if (!slug) {
        return res.status(400).send("Slug required");
      }

      console.log(`[iCal Export] Generating for: ${slug}`);

      const calendar = ical({ 
        name: `Pera Apartments - ${slug}`,
        prodId: { company: 'Pera Apartments', product: 'Booking Sync', language: 'RO' },
        method: ICalCalendarMethod.PUBLISH
      });

      if (adminDb || db) {
        // 1. Fetch Bookings
        let querySnapshot;
        try {
          if (adminDb) {
            console.log("[iCal Export] fetching bookings using Admin SDK...");
            querySnapshot = await adminDb.collection('bookings')
              .where('status', 'in', ['paid', 'confirmed', 'succeeded'])
              .get();
          } else {
            console.log("[iCal Export] Using Client SDK for Firestore access");
            const q = query(collection(db, 'bookings'), where('status', 'in', ['paid', 'confirmed', 'succeeded']));
            querySnapshot = await getDocs(q);
          }
        } catch (fetchError: any) {
          console.error("[iCal Export] Bookings fetch failed:", fetchError.message);
          querySnapshot = { forEach: () => {} };
        }
        
        // 2. Fetch Manual Blocks
        let blocksSnapshot;
        try {
          if (adminDb) {
            blocksSnapshot = await adminDb.collection('manual_blocks').get();
          } else {
            blocksSnapshot = await getDocs(collection(db, 'manual_blocks'));
          }
        } catch (fetchBlocksError: any) {
          console.error("[iCal Export] Blocks fetch failed:", fetchBlocksError.message);
          blocksSnapshot = { forEach: () => {} };
        }

        let hasEvents = false;
        const searchSlug = slug.toLowerCase();
        const searchName = searchSlug.replace(/-/g, ' ');

        // Explicit mapping for common user slugs
        const slugAliases: Record<string, string[]> = {
          'premium-king': ['1', 'apartament-premium-king', 'camera king', 'king room'],
          'deluxe-double': ['2', 'apartament-deluxe-double', 'camera dubla deluxe', 'deluxe double'],
          'family-deluxe': ['3', 'apartament-family-deluxe', 'camera de familie deluxe', 'family deluxe'],
          'family-standard': ['4', 'apartament-family-standard', 'camera de familie standard', 'family standard'],
          'peraduo': ['5', 'pera-duo', 'peraduo'],
          'peraconfort': ['6', 'pera-confort', 'peraconfort']
        };

        const aliases = slugAliases[searchSlug] || [];

        // Process Bookings
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
              id: `booking-${doc.id}`,
              start: new Date(booking.checkIn),
              end: new Date(booking.checkOut),
              allDay: true,
              summary: 'Rezervare Site (Pera Apartments)',
              description: `Oaspete: ${booking.guestName}`,
              busystatus: ICalEventBusyStatus.BUSY
            });
          }
        });

        // Process Manual Blocks
        blocksSnapshot.forEach((doc: any) => {
          const block = doc.data();
          const blockAptId = (block.apartmentId || '').trim().toLowerCase();
          
          const isMatch = blockAptId === 'all' || 
                          blockAptId === 'toate' ||
                          blockAptId === searchSlug || 
                          searchSlug.includes(blockAptId.replace(/ /g, '-')) ||
                          blockAptId.includes(searchSlug.replace(/-/g, ' '));

          if (isMatch && block.startDate && block.endDate) {
            hasEvents = true;
            calendar.createEvent({
              id: `block-${doc.id}`,
              start: new Date(block.startDate),
              end: new Date(block.endDate),
              allDay: true,
              summary: 'Blocaj Manual (Pera Apartments)',
              description: block.reason || 'Mentenanță',
              busystatus: ICalEventBusyStatus.BUSY
            });
          }
        });

        // Add a placeholder event if empty to pass validation
        // 3. Fetch External Blocked Dates (Synced from Airbnb/Booking/Google)
        try {
          const externalDates = await getApartmentBlockedDates(slug);
          externalDates.forEach((dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d, 12, 0, 0);
            
            hasEvents = true;
            calendar.createEvent({
              id: `external-${slug}-${dateStr}`,
              start: dateObj,
              end: dateObj,
              allDay: true,
              summary: 'Occupied (External Sync)',
              description: 'Imported from external calendar feed',
              busystatus: ICalEventBusyStatus.BUSY
            });
          });
        } catch (extError) {
          console.error("[iCal Export] External dates fetch failed:", extError);
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
      
      // Strict headers for iCal validators
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.ics"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return res.status(200).send(output);
    } catch (error: any) {
      console.error("[iCal Export] Error:", error);
      return res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message,
        stack: error.stack,
        slug: req.params.slug || req.params[0]
      });
    }
  };

  // Improved route matching
  app.get("/api/ical*", handleIcalExport);
  app.get("/api/export-ical*", handleIcalExport);
  app.get("/export-ical*", handleIcalExport);

  app.get("/api/sync-calendars", async (req, res) => {
    const targetSlug = req.query.slug as string;
    const targetSource = req.query.source as string;
    
    try {
      // 1. Get apartments from Firestore and merge with master list
      let apartmentsInDb: string[] = [];
      try {
        if (adminDb) {
          const snapshot = await adminDb.collection('apartments').get();
          apartmentsInDb = snapshot.docs.map(doc => doc.data().slug);
        } else if (db) {
          const snapshot = await getDocs(collection(db, 'apartments'));
          apartmentsInDb = snapshot.docs.map(doc => doc.data().slug);
        }
      } catch (e) {
        console.error("[Sync] DB Fetch Error:", e);
      }

      const masterList = [
        'apartament-premium-king',
        'apartament-deluxe-double',
        'apartament-family-standard',
        'apartament-family-deluxe',
        'peraduo',
        'peraconfort',
        'premium-king',
        'deluxe-double',
        'family-standard',
        'family-deluxe'
      ];

      // Normalize all slugs to lowercase and ensure uniqueness
      const dbSlugs = (apartmentsInDb || []).map(s => s.toLowerCase().trim());
      const allSlugs = Array.from(new Set([
        ...masterList,
        ...dbSlugs
      ])).filter(Boolean);

      const syncApartments = targetSlug ? [targetSlug.toLowerCase().trim()] : allSlugs;
      console.log(`[Local Sync] Starting sync for ${syncApartments.length} rooms. Slugs: ${syncApartments.join(', ')}`);
      
      const allEnvKeys = Object.keys(process.env);
      const icalKeys = allEnvKeys.filter(k => k.startsWith('ICAL_'));
      console.log(`[Local Sync] ICAL environment keys found: ${icalKeys.length} keys.`);
      if (icalKeys.length > 0) {
        console.log(`[Local Sync] Sample keys: ${icalKeys.slice(0, 5).join(', ')}`);
      }

      const initialResults: any[] = [];
      const syncPromises = syncApartments.map(async (slug) => {
        const normalizedSlug = slug.toLowerCase().trim();
        const roomResults: any[] = [];
        
        try {
          // Find links in environment variables
          const baseKey = normalizedSlug.replace('apartament-', '').replace(/-/g, '_').toUpperCase();
          const keysToTry = [
            baseKey,
            normalizedSlug.replace(/-/g, '_').toUpperCase(),
            normalizedSlug.toUpperCase(),
            baseKey.replace('APARTAMENT_', '')
          ];
          
          const mapping: Record<string, string> = {
            'apartament-premium-king': 'PREMIUM_KING',
            'apartament-deluxe-double': 'DELUXE_DOUBLE',
            'apartament-family-standard': 'FAMILY_STANDARD',
            'apartament-family-deluxe': 'FAMILY_DELUXE',
            'peraduo': 'PERADUO',
            'peraconfort': 'PERACONFORT',
            'premium-king': 'PREMIUM_KING',
            'deluxe-double': 'DELUXE_DOUBLE',
            'family-standard': 'FAMILY_STANDARD',
            'family-deluxe': 'FAMILY_DELUXE'
          };
          
          if (mapping[normalizedSlug]) keysToTry.unshift(mapping[normalizedSlug]);

          let bookingUrl = '';
          let airbnbUrl = '';

          for (const k of keysToTry) {
            if (!bookingUrl) bookingUrl = process.env[`ICAL_BOOKING_${k}`] || '';
            if (!airbnbUrl) airbnbUrl = process.env[`ICAL_AIRBNB_${k}`] || '';
          }

          if (!bookingUrl && !airbnbUrl) {
            return [{ slug, source: 'Config', status: 'skipped', message: 'Nicio sursă configurată (Check .env)' }];
          }

          // Booking Sync
          if (!targetSource || targetSource.toLowerCase() === 'booking') {
            if (bookingUrl) {
              try {
                await syncExternalIcalToGoogle(slug, bookingUrl, 'Booking.com');
                roomResults.push({ slug, source: 'Booking', status: 'success' });
              } catch (err: any) {
                console.error(`[Sync] Booking Error for ${slug}:`, err.message);
                roomResults.push({ slug, source: 'Booking', status: 'error', message: err.message });
              }
            }
          }
          
          // Airbnb Sync 
          if (!targetSource || targetSource.toLowerCase() === 'airbnb') {
            if (airbnbUrl) {
              try {
                await syncExternalIcalToGoogle(slug, airbnbUrl, 'Airbnb');
                roomResults.push({ slug, source: 'Airbnb', status: 'success' });
              } catch (err: any) {
                console.error(`[Sync] Airbnb Error for ${slug}:`, err.message);
                roomResults.push({ slug, source: 'Airbnb', status: 'error', message: err.message });
              }
            }
          }

          if (roomResults.length === 0) {
            roomResults.push({ slug, source: 'Config', status: 'skipped', message: 'Sursă negăsită pentru criteriul selectat' });
          }
        } catch (roomError: any) {
          console.error(`[Sync] Critical room error for ${slug}:`, roomError.message);
          roomResults.push({ slug, source: 'General', status: 'error', message: roomError.message });
        }
        return roomResults;
      });

      const resultsNested = await Promise.all(syncPromises);
      const finalResults = resultsNested.flat();
      
      res.json({ 
        status: "Sync completed", 
        results: finalResults,
        note: targetSlug ? "Individual sync" : "Full sync"
      });
    } catch (error: any) {
      console.error(`[Local Sync] Critical Error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.1.2",
      env: process.env.NODE_ENV,
      dbInitialized: !!db,
      adminDbInitialized: !!adminDb,
      stripeKey: !!process.env.STRIPE_SECRET_KEY,
      gmailUser: !!process.env.GMAIL_USER,
      gmailPass: !!process.env.GMAIL_APP_PASSWORD,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
    });
  });

  // 1. CORS & JSON Parsing (Moved up to ensure all routes benefit)
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const metadata = session.metadata;
        if (metadata) {
            const bookingData = {
              apartmentId: metadata.apartmentId,
              apartmentName: metadata.apartmentName || 'Apartament Pera',
              checkIn: metadata.checkIn,
              checkOut: metadata.checkOut,
              guestName: metadata.guestName,
              guestEmail: metadata.guestEmail,
              totalPrice: parseFloat(metadata.totalPrice),
              status: 'confirmed',
              paymentIntentId: session.payment_intent as string,
              sessionId: session.id,
              createdAt: new Date().toISOString(),
              source: 'stripe_webhook_preview'
            };

            if (db) {
              await addDoc(collection(db, 'bookings'), bookingData);
              console.log(`Booking saved to Firestore for session ${session.id}`);
            }

            // 1.5. Log to Google Sheets & Calendar
            try {
              await Promise.all([
                logBookingToSheet(bookingData),
                addBookingToCalendar(bookingData)
              ]);
            } catch (syncError) {
              console.error("Failed to sync booking to Google Services:", syncError);
            }

            // 2. Send Confirmation Email
          const recipients = ['contact.peraapartments@gmail.com', 'petreandrei1979@gmail.com'];
          if (metadata.guestEmail) {
            recipients.push(metadata.guestEmail);
          }

          console.log(`[Webhook] Attempting to send confirmation email to: ${recipients.join(', ')}`);
          
          try {
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

  app.get("/api/blocked-dates/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const blockedDates = await getApartmentBlockedDates(slug);
      res.json({ blockedDates });
    } catch (error: any) {
      console.error("Error fetching blocked dates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-discount-email", async (req, res) => {
    console.log(`[${new Date().toISOString()}] Attempting to send discount email to: ${req.body.email}`);
    try {
      const { email, name } = req.body;
      
      if (!process.env.GMAIL_APP_PASSWORD) {
        console.error("GMAIL_APP_PASSWORD is missing in environment variables!");
        return res.status(500).json({ error: "Configurația de email lipsește." });
      }

      // Log Lead to Firestore and Google Sheets
      const leadData = {
        email,
        name: name || 'Nespecificat',
        type: 'Discount 20%',
        createdAt: new Date().toISOString()
      };

      try {
        if (db) {
          await addDoc(collection(db, 'leads'), leadData);
        }
        await logLeadToSheet(leadData);
      } catch (logErr) {
        console.error("Error logging lead:", logErr);
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
            <p style="font-size: 12px; color: #888;">Oferta este valabilă până pe 30 aprilie 2026.</p>
          </div>
        `,
      });

      console.log("Discount email sent successfully via Gmail.");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server Error sending discount email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    console.log(`[${new Date().toISOString()}] POST /api/create-checkout-session`);
    try {
      const { apartmentId, apartmentName, totalPrice, checkIn, checkOut, guestEmail, guestName } = req.body;

      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        console.error("ERROR: STRIPE_SECRET_KEY is missing in production environment!");
        return res.status(500).json({ 
          error: "Configurația Stripe lipsește pe server. Te rugăm să adaugi STRIPE_SECRET_KEY în setările de deploy." 
        });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const origin = req.headers.origin || `${protocol}://${host}`;

      // Check availability before creating session
      try {
        const blockedDates = await getApartmentBlockedDates(apartmentId);
        const requestedRange = eachDayOfInterval({
          start: parseISO(checkIn),
          end: parseISO(checkOut)
        });
        const requestedDates = requestedRange.map(d => format(d, 'yyyy-MM-dd'));
        // CheckIn up to CheckOut-1 (CheckOut day can be the same as someone else's CheckIn)
        const datesToVerify = requestedDates.slice(0, requestedDates.length - 1);
        
        const isUnavailable = datesToVerify.some(date => blockedDates.includes(date));
        if (isUnavailable) {
          console.warn(`[Checkout] Dates ${checkIn} - ${checkOut} are no longer available for ${apartmentId}`);
          return res.status(400).json({ 
            error: "Din păcate, datele selectate tocmai au fost rezervate. Te rugăm să încerci alte date." 
          });
        }
      } catch (checkErr) {
        console.error("Availability check failed during checkout:", checkErr);
        // We continue in case of error to not block user, but ideally this works
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

      console.log("Session created successfully:", session.id);
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
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({ 
        status: session.payment_status === "paid" ? "success" : "pending", 
        metadata: session.metadata 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/log-login", async (req, res) => {
    try {
      const auth = await getSheetsAuth();
      if (!auth) throw new Error("Google Sheets auth not configured");
      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Autentificari!A2:E100',
      });
      res.json({ logs: response.data.values || [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sheet-bookings", async (req, res) => {
    try {
      const auth = await getSheetsAuth();
      if (!auth) throw new Error("Google Sheets auth not configured");
      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Rezervari!A2:K200',
      });
      res.json({ bookings: response.data.values || [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/log-login", async (req, res) => {
    try {
      const { email, displayName, method } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      
      await logLoginToSheet({ email, displayName, method });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error logging login to sheet:", error);
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

  // 3. VITE / STATIC FILES (Must be after API)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // In production, everything from public is already in dist
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ----- BACKGROUND SYNC TASK -----
  const runFullSync = async () => {
    console.log(`[Background Sync] Starting full iCal -> Google Calendar sync at ${new Date().toISOString()}`);
    const apartments = [
      'apartament-premium-king',
      'apartament-deluxe-double',
      'apartament-family-standard',
      'apartament-family-deluxe',
      'peraduo',
      'peraconfort'
    ];

    for (const slug of apartments) {
      const envKey = slug.replace(/-/g, '_').toUpperCase().replace('APARTAMENT_', '');
      const bookingUrl = process.env[`ICAL_BOOKING_${envKey}`];
      const airbnbUrl = process.env[`ICAL_AIRBNB_${envKey}`];

      if (bookingUrl) {
        await syncExternalIcalToGoogle(slug, bookingUrl, 'Booking.com');
      }
      if (airbnbUrl) {
        await syncExternalIcalToGoogle(slug, airbnbUrl, 'Airbnb');
      }
    }
    console.log("[Background Sync] Finished full sync.");
  };

  // Run on start
  runFullSync();
  // Run every 30 minutes
  setInterval(runFullSync, 30 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
