import express from "express";
import path from "path";
import fs from "fs";
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
  const distPath = path.join(process.cwd(), 'dist');

  console.log("[Server] Registering diagnostic logger...");
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  console.log("[Server] Configuring CORS and security...");
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
  }));

  // 1. HEALTH CHECK (MUST be before any complex middleware)
  app.get("/api/health", (req, res) => {
    console.log("[Health] Responding to health check...");
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      version: "1.6.2-FIX",
      env: process.env.NODE_ENV,
      adminDb: !!adminDb,
      clientDb: !!db
    });
  });

  // 2. STRIPE WEBHOOK (Needs raw body, MUST be before express.json())
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      if (!stripe) throw new Error("Stripe is not initialized");
      if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is missing");
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
              totalPrice: parseFloat(metadata.totalPrice || '0'),
              status: 'confirmed',
              paymentIntentId: session.payment_intent as string,
              sessionId: session.id,
              createdAt: new Date().toISOString(),
              source: 'stripe_webhook'
            };
            if (db) await addDoc(collection(db, 'bookings'), bookingData);
            try { 
              await Promise.all([
                logBookingToSheet(bookingData), 
                addBookingToCalendar(bookingData)
              ]); 
            } catch (syncError) { console.error("Sync Error:", syncError); }
            
            const recipients = ['contact.peraapartments@gmail.com', 'petreandrei1979@gmail.com'];
            if (metadata.guestEmail) recipients.push(metadata.guestEmail);
            try {
              await transporter.sendMail({
                from: `"Pera Apartments" <${process.env.GMAIL_USER || 'contact.peraapartments@gmail.com'}>`,
                to: recipients, 
                subject: 'Confirmare Rezervare - Pera Apartments',
                html: `<h2>Rezervare Nouă Confirmată!</h2><p>Oaspete: ${metadata.guestName}</p><p>Apartament: ${metadata.apartmentName}</p>`
              });
            } catch (emailError) { console.error("Email Error:", emailError); }
        }
      } catch (error) { console.error("Webhook processing error:", error); }
    }
    res.json({ received: true });
  });

  // 3. JSON BODY PARSER
  console.log("[Server] Registering JSON parser...");
  app.use(express.json());

  // 4. API ROUTE HANDLERS
  async function handleIcalExport(req: any, res: any) {
    try {
      console.log(`[iCal-HIT] ${new Date().toISOString()} | Path: ${req.path}`);
      let slug = req.params.slug || req.path.split('/').pop() || '';
      if (slug.toLowerCase().endsWith('.ics')) slug = slug.substring(0, slug.length - 4);
      if (!slug) return res.status(400).send("Slug required");

      const calendar = ical({ 
        name: `Pera Apartments - ${slug}`,
        prodId: { company: 'Pera Apartments', product: 'Booking Sync', language: 'RO' },
        method: ICalCalendarMethod.PUBLISH
      });

      if (adminDb) {
        const querySnapshot = await adminDb.collection('bookings')
            .where('status', 'in', ['paid', 'confirmed', 'succeeded'])
            .get();
        
        let blocksSnapshot: any = { forEach: () => {} };
        try { blocksSnapshot = await adminDb.collection('manual_blocks').get(); } catch (e) {}

        const searchSlug = slug.toLowerCase();
        const searchName = searchSlug.replace(/-/g, ' ');
        
        querySnapshot.forEach((doc: any) => {
          const booking = doc.data();
          const aptId = (booking.apartmentId || '').toLowerCase();
          const aptName = (booking.apartmentName || '').toLowerCase();
          if (aptId === searchSlug || aptName.includes(searchName)) {
            calendar.createEvent({
              start: new Date(booking.checkIn),
              end: new Date(booking.checkOut),
              allDay: true,
              summary: 'Rezervare Site',
              busystatus: ICalEventBusyStatus.BUSY
            });
          }
        });

        blocksSnapshot.forEach((doc: any) => {
          const block = doc.data();
          const blockAptId = (block.apartmentId || '').trim().toLowerCase();
          if (blockAptId === 'all' || blockAptId === searchSlug) {
            calendar.createEvent({
              start: new Date(block.startDate),
              end: new Date(block.endDate),
              allDay: true,
              summary: 'Blocaj Manual',
              busystatus: ICalEventBusyStatus.BUSY
            });
          }
        });
      }

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.ics"`);
      return res.status(200).send(calendar.toString());
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async function handleSync(req: express.Request, res: express.Response) {
    try {
      const targetSlug = req.query.slug as string;
      const masterList = ['apartament-premium-king', 'apartament-deluxe-double', 'apartament-family-standard', 'apartament-family-deluxe', 'peraduo', 'peraconfort'];
      const syncApartments = targetSlug ? [targetSlug.toLowerCase().trim()] : masterList;
      const mapping: Record<string, string> = {
        'apartament-premium-king': 'PREMIUM_KING', 'apartament-deluxe-double': 'DELUXE_DOUBLE',
        'apartament-family-standard': 'FAMILY_STANDARD', 'apartament-family-deluxe': 'FAMILY_DELUXE',
        'peraduo': 'PERADUO', 'peraconfort': 'PERACONFORT'
      };
      for (const slug of syncApartments) {
        const baseKey = mapping[slug] || slug.toUpperCase().replace(/-/g, '_');
        const bookingUrl = process.env[`ICAL_BOOKING_${baseKey}`];
        const airbnbUrl = process.env[`ICAL_AIRBNB_${baseKey}`];
        if (bookingUrl) await syncExternalIcalToGoogle(slug, bookingUrl, 'Booking.com').catch(e => console.error(e));
        if (airbnbUrl) await syncExternalIcalToGoogle(slug, airbnbUrl, 'Airbnb').catch(e => console.error(e));
      }
      return res.json({ status: "Sync triggered" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  console.log("[Server] Registering API routes...");
  app.all("/api/sync", handleSync);
  app.all("/api/sync-calendar", handleSync);
  app.all("/api/sync-calendars", handleSync);
  app.get(["/api/ical/:slug", "/api/ical/:slug.ics", "/api/export-ical/:slug", "/api/export-ical/:slug.ics"], handleIcalExport);

  app.get("/api/sheet-bookings", async (req, res) => {
    try {
      const auth = await getSheetsAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID, range: 'Rezervari!A2:K200',
      });
      res.json({ bookings: response.data.values || [] });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/blocked-dates/:slug", async (req, res) => {
    try { res.json({ blockedDates: await getApartmentBlockedDates(req.params.slug) }); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/log-login", async (req, res) => {
    try { await logLoginToSheet(req.body); res.json({ success: true }); }
    catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/send-discount-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      const leadData = { email, name: name || 'Nespecificat', type: 'Discount 20%', createdAt: new Date().toISOString() };
      if (db) await addDoc(collection(db, 'leads'), leadData);
      await logLeadToSheet(leadData);
      await transporter.sendMail({
        from: `"Pera Apartments" <${process.env.GMAIL_USER}>`,
        to: email, subject: 'Codul tău de reducere 20% - Pera Apartments',
        html: `<h2>Salut, ${name}!</h2><p>Codul tău: <strong>PASTE20</strong></p>`
      });
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { apartmentId, apartmentName, totalPrice, checkIn, checkOut, guestEmail, guestName } = req.body;
      const origin = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: { currency: "ron", product_data: { name: `Rezervare ${apartmentName}`, description: `${checkIn} - ${checkOut}` }, unit_amount: Math.round(totalPrice * 100) },
          quantity: 1,
        }],
        mode: "payment",
        allow_promotion_codes: true,
        success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/apartamente/${apartmentId}`,
        customer_email: guestEmail || undefined,
        metadata: { apartmentId, apartmentName, checkIn, checkOut, guestName, guestEmail, totalPrice: totalPrice.toString() },
      });
      res.json({ id: session.id, url: session.url });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/verify-booking", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
      res.json({ status: session.payment_status === "paid" ? "success" : "pending", metadata: session.metadata });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/debug-firestore", async (req, res) => {
    const results: any = { adminDb: !!adminDb, clientDb: !!db };
    try { if (adminDb) results.count = (await adminDb.collection('apartments').get()).size; } catch(e:any) { results.err = e.message; }
    res.json(results);
  });

  // Final catch-all for any /api/* route that didn't match
  app.all("/api/*", (req, res) => {
    console.warn(`[API-404] No match for ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found", path: req.url });
  });

  // 5. VITE / STATIC FILES
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Configuring Vite middleware for development...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ 
      root: process.cwd(), 
      server: { 
        middlewareMode: true, 
        host: '0.0.0.0',
        hmr: false 
      }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
    
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      console.log(`[SPA-Fallback] Serving index.html for ${req.url}`);
      res.sendFile(path.join(process.cwd(), 'index.html'));
    });
  } else {
    console.log("[Server] Configuring static files for production...");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: "API route not found" });
      console.log(`[Production-Fallback] Serving index.html for ${req.url}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. START LISTENING
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] L-A-N-S-A-T pe portul ${PORT} în mod ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Health check disponibil la /api/health`);
  });

  // 7. BACKGROUND SYNC
  const runFullSync = async () => {
    console.log("[Background Sync] Starting full sync...");
    const apartments = ['apartament-premium-king', 'apartament-deluxe-double', 'apartament-family-standard', 'apartament-family-deluxe', 'peraduo', 'peraconfort'];
    for (const slug of apartments) {
      try {
        const mapping: Record<string, string> = { 'apartament-premium-king': 'PREMIUM_KING', 'apartament-deluxe-double': 'DELUXE_DOUBLE', 'apartament-family-standard': 'FAMILY_STANDARD', 'apartament-family-deluxe': 'FAMILY_DELUXE', 'peraduo': 'PERADUO', 'peraconfort': 'PERACONFORT' };
        const baseKey = mapping[slug] || slug.toUpperCase().replace(/-/g, '_');
        const urls = [process.env[`ICAL_BOOKING_${baseKey}`], process.env[`ICAL_AIRBNB_${baseKey}`]];
        if (urls[0]) await syncExternalIcalToGoogle(slug, urls[0], 'Booking.com').catch(() => {});
        if (urls[1]) await syncExternalIcalToGoogle(slug, urls[1], 'Airbnb').catch(() => {});
      } catch (err) {}
    }
  };
  setTimeout(runFullSync, 10000);
  setInterval(runFullSync, 30 * 60 * 1000);
}

console.log("[Server] Starting initialization...");
startServer().catch(err => {
  console.error("[Server] FATAL: Failed to start server:", err);
  process.exit(1);
});
