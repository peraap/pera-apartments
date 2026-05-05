import express from "express";
import { createServer as createViteServer } from "vite";
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

  app.use(express.json());
  
  // 1. CORS & Global Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
  }));

  // ----- CRITICAL API ROUTES HANDLERS & REGISTRATION -----
  async function handleIcalExport(req: any, res: any) {
    try {
      console.log(`[iCal-HIT] ${new Date().toISOString()} | Method: ${req.method} | URL: ${req.originalUrl} | Path: ${req.path}`);
      
      let slug = req.params.slug || req.path.split('/').pop() || '';
      if (slug.startsWith('/')) slug = slug.substring(1);
      if (slug.toLowerCase().endsWith('.ics')) slug = slug.substring(0, slug.length - 4);
      
      if (!slug || ['api', 'ical', 'export-ical'].includes(slug.toLowerCase())) {
        return res.status(400).send("Slug required");
      }

      const calendar = ical({ 
        name: `Pera Apartments - ${slug}`,
        prodId: { company: 'Pera Apartments', product: 'Booking Sync', language: 'RO' },
        method: ICalCalendarMethod.PUBLISH
      });

      if (adminDb) {
        const querySnapshot = await adminDb.collection('bookings')
            .where('status', 'in', ['paid', 'confirmed', 'succeeded'])
            .get();
        
        let blocksSnapshot = { forEach: () => {} };
        try { blocksSnapshot = await adminDb.collection('manual_blocks').get(); } catch (e) {}

        const searchSlug = slug.toLowerCase();
        const searchName = searchSlug.replace(/-/g, ' ');
        const slugAliases: Record<string, string[]> = {
          'premium-king': ['1', 'apartament-premium-king', 'camera king', 'king room'],
          'deluxe-double': ['2', 'apartament-deluxe-double', 'camera dubla deluxe', 'deluxe double'],
          'family-deluxe': ['3', 'apartament-family-deluxe', 'camera de familie deluxe', 'family deluxe'],
          'family-standard': ['4', 'apartament-family-standard', 'camera de familie standard', 'family standard'],
          'peraduo': ['5', 'pera-duo', 'peraduo'],
          'peraconfort': ['6', 'pera-confort', 'peraconfort']
        };
        const aliases = slugAliases[searchSlug] || [];

        querySnapshot.forEach((doc: any) => {
          const booking = doc.data();
          const aptId = (booking.apartmentId || '').toLowerCase();
          const aptName = (booking.apartmentName || '').toLowerCase();
          if (aptId === searchSlug || aliases.includes(aptId) || aptName.includes(searchName)) {
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
    console.log(`[SYNC-HIT] ${new Date().toISOString()} | Method: ${req.method} | Path: ${req.path}`);
    try {
      const targetSlug = req.query.slug as string;
      const targetSource = req.query.source as string;
      const masterList = ['apartament-premium-king', 'apartament-deluxe-double', 'apartament-family-standard', 'apartament-family-deluxe', 'peraduo', 'peraconfort'];
      const syncApartments = targetSlug ? [targetSlug.toLowerCase().trim()] : masterList;
      
      const results: any[] = [];
      for (const slug of syncApartments) {
        const mapping: Record<string, string> = {
          'apartament-premium-king': 'PREMIUM_KING', 'apartament-deluxe-double': 'DELUXE_DOUBLE',
          'apartament-family-standard': 'FAMILY_STANDARD', 'apartament-family-deluxe': 'FAMILY_DELUXE',
          'peraduo': 'PERADUO', 'peraconfort': 'PERACONFORT',
          'premium-king': 'PREMIUM_KING', 'deluxe-double': 'DELUXE_DOUBLE',
          'family-standard': 'FAMILY_STANDARD', 'family-deluxe': 'FAMILY_DELUXE'
        };
        const baseKey = mapping[slug.toLowerCase().trim()] || slug.toUpperCase().replace(/-/g, '_');
        const bookingUrl = process.env[`ICAL_BOOKING_${baseKey}`];
        const airbnbUrl = process.env[`ICAL_AIRBNB_${baseKey}`];

        if (bookingUrl && (!targetSource || targetSource.toLowerCase() === 'booking')) {
          try { await syncExternalIcalToGoogle(slug, bookingUrl, 'Booking.com'); results.push({ slug, source: 'Booking', status: 'success' }); } 
          catch (err: any) { results.push({ slug, source: 'Booking', status: 'error', message: err.message }); }
        }
        if (airbnbUrl && (!targetSource || targetSource.toLowerCase() === 'airbnb')) {
          try { await syncExternalIcalToGoogle(slug, airbnbUrl, 'Airbnb'); results.push({ slug, source: 'Airbnb', status: 'success' }); } 
          catch (err: any) { results.push({ slug, source: 'Airbnb', status: 'error', message: err.message }); }
        }
      }
      return res.json({ status: "Sync completed", results });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // REGISTER PRIORITY API ROUTES IMMEDIATELY
  app.get("/api/ical/:slug", handleIcalExport);
  app.get("/api/ical/:slug.ics", handleIcalExport);
  app.get("/api/export-ical/:slug", handleIcalExport);
  app.get("/api/export-ical/:slug.ics", handleIcalExport);
  app.get("/export-ical/:slug", handleIcalExport);
  app.get("/export-ical/:slug.ics", handleIcalExport);
  app.all("/api/sync", handleSync);
  app.all("/api/sync-calendar", handleSync);
  app.all("/api/sync-calendars", handleSync);
  
  // All other API routes for the app
  app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
  
  app.get("/api/sheet-bookings", async (req, res) => {
    try {
      const auth = await getSheetsAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Rezervari!A2:K200',
      });
      res.json({ bookings: response.data.values || [] });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/blocked-dates/:slug", async (req, res) => {
    try {
      const blockedDates = await getApartmentBlockedDates(req.params.slug);
      res.json({ blockedDates });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/log-login", async (req, res) => {
    try {
      const auth = await getSheetsAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Autentificari!A2:E100',
      });
      res.json({ logs: response.data.values || [] });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/log-login", async (req, res) => {
    try {
      await logLoginToSheet(req.body);
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/send-discount-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      const leadData = { email, name: name || 'Nespecificat', type: 'Discount 20%', createdAt: new Date().toISOString() };
      if (db) await addDoc(collection(db, 'leads'), leadData);
      await logLeadToSheet(leadData);
      await transporter.sendMail({
        from: `"Pera Apartments" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Codul tău de reducere 20% - Pera Apartments',
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

  app.post("/api/send-confirmation-email", async (req, res) => {
    try {
      const { metadata } = req.body;
      if (!metadata || !metadata.guestEmail) return res.status(400).json({ error: "Date insuficiente" });
      const recipients = ['contact.peraapartments@gmail.com', 'petreandrei1979@gmail.com', metadata.guestEmail];
      await transporter.sendMail({
        from: `"Pera Apartments" <${process.env.GMAIL_USER}>`,
        to: recipients,
        subject: 'Confirmare Rezervare - Pera Apartments',
        html: `<h2>Rezervare Confirmată!</h2><p>Apartament: ${metadata.apartmentName}</p>`
      });
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Catch-all API error handler (for debugging only)
  // Cleaned up old registrations
  const distPath = path.join(process.cwd(), 'dist');
  const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
  console.log(`[Server] dist/index.html exists: ${indexExists} at ${distPath}`);
  const rootIndexExists = fs.existsSync(path.join(process.cwd(), 'index.html'));
  console.log(`[Server] root index.html exists: ${rootIndexExists} at ${process.cwd()}`);

  // iCal Export Handler moved to top

  app.get("/api/debug-firestore", async (req, res) => {
    const results: any = {
      firebaseConfig: { projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId },
      adminDbInitialized: !!adminDb,
      clientDbInitialized: !!db
    };

    try {
      if (adminDb) {
        const snap = await adminDb.collection('apartments').limit(1).get();
        results.adminAccess = { status: 'success', count: snap.size };
      } else {
        results.adminAccess = { status: 'missing' };
      }
    } catch (err: any) {
      results.adminAccess = { status: 'failed', error: err.message };
    }

    try {
      if (db) {
        const snap = await getDocs(collection(db, 'apartments'));
        results.clientAccess = { status: 'success', count: snap.size };
      } else {
        results.clientAccess = { status: 'missing' };
      }
    } catch (err: any) {
      results.clientAccess = { status: 'failed', error: err.message };
    }

    res.json(results);
  });

  // 0. The actual route registration is now at the top

  // handleSync moved to top

  // The actual route registration is now at the top

  // Debug Logging Middleware
  app.use((req, res, next) => {
    // Skip logging for internal Vite assets/sources to reduce noise
    const isAsset = req.path.startsWith('/src/') || 
                     req.path.startsWith('/node_modules/') || 
                     req.path.startsWith('/@') || 
                     req.path.includes('.tsx') || 
                     req.path.includes('.ts');

    if (!isAsset) {
      if (req.path.startsWith('/admin')) {
        console.log(`[ADMIN-LOG] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      } else {
        console.log(`[Request] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      }
    }
    next();
  });

  // API Routes - Health Check first
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.4.9",
      env: process.env.NODE_ENV,
      dbInitialized: !!db,
      adminDbInitialized: !!adminDb
    });
  });

  app.get("/api/debug-api", (req, res) => {
    res.json({ status: "alive", path: req.path, time: new Date().toISOString() });
  });

  // CORS is already handled manually at the top
  
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

  // API routes moved to top

  // Moved to top

  // Catch-all API logger for debugging 404s
  app.all("/api/*", (req, res, next) => {
    // If we're here, it means no previous /api route matched
    console.warn(`[API-404] No match found for ${req.method} ${req.path}`);
    next();
  });

  // 3. VITE / STATIC FILES (Must be after API)
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Configuring Vite middleware for development");
    const vite = await createViteServer({
      root: process.cwd(),
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicit route for /admin to ensure it hits React Router
    app.get(['/admin', '/admin/*'], (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      console.log(`[Admin Fallback] Serving index.html for ${req.path}`);
      res.sendFile(path.join(process.cwd(), 'index.html'));
    });

    // Explicitly handle SPA fallback in dev if Vite middleware misses it for some reason
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      console.log(`[Dev Fallback] Serving index.html for ${req.path}`);
      res.sendFile(path.join(process.cwd(), 'index.html'));
    });
  } else {
    console.log("[Server] Configuring static files for production");
    // In production, everything from public is already in dist
    app.use(express.static(distPath));
    
    app.get(['/admin', '/admin/*'], (req, res) => {
      console.log(`[Production Admin] Serving index.html for ${req.path}`);
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error("[Fatal] dist/index.html not found!");
        res.status(404).send("Error: Application not built correctly (index.html missing)");
      }
    });

    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        console.warn(`[404] API Not Found: ${req.path}`);
        return res.status(404).json({ error: "API route not found" });
      }
      console.log(`[Production Fallback] Serving index.html for ${req.path}`);
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
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

    const mapping: Record<string, string> = {
      'apartament-premium-king': 'PREMIUM_KING',
      'apartament-deluxe-double': 'DELUXE_DOUBLE',
      'apartament-family-standard': 'FAMILY_STANDARD',
      'apartament-family-deluxe': 'FAMILY_DELUXE',
      'peraduo': 'PERADUO',
      'peraconfort': 'PERACONFORT'
    };

    for (const slug of apartments) {
      try {
        const baseKey = mapping[slug] || slug.replace('apartament-', '').replace(/-/g, '_').toUpperCase();
        const bookingUrl = process.env[`ICAL_BOOKING_${baseKey}`];
        const airbnbUrl = process.env[`ICAL_AIRBNB_${baseKey}`];

        if (bookingUrl) {
          await syncExternalIcalToGoogle(slug, bookingUrl, 'Booking.com');
        }
        if (airbnbUrl) {
          await syncExternalIcalToGoogle(slug, airbnbUrl, 'Airbnb');
        }
      } catch (err: any) {
        console.error(`[Background Sync] Error syncing ${slug}:`, err.message);
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
