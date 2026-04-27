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
import { logBookingToSheet, logLoginToSheet, getSheetsAuth } from "./google-sheets-storage";
import { addBookingToCalendar } from "./google-calendar-service";
import { getApartmentBlockedDates } from "./ical-sync";
import ical, { ICalCalendarMethod, ICalEventBusyStatus } from "ical-generator";
import { google } from "googleapis";
import admin from "firebase-admin";
import { adminDb } from "./firebase-admin-service";
import dotenv from "dotenv";
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

  // 1. CORS & JSON Parsing (Must be first)
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

  app.use(express.json());

  // 2. API ROUTES (Defined directly on app for maximum priority)
  const handleIcalExport = async (req: any, res: any) => {
    try {
      let slug = req.params[0] || req.params.slug;
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
          console.error("[iCal Export] Fetch failed:", fetchError.message);
          // Create a mock snapshot that does nothing when iterated
          querySnapshot = { forEach: () => {} };
        }
        
        let hasEvents = false;
        querySnapshot.forEach((doc: any) => {
          const booking = doc.data();
          const matchesSlug = booking.apartmentId === slug || 
                             (booking.apartmentName && booking.apartmentName.toLowerCase().includes(slug.replace(/-/g, ' '))) ||
                             (slug === 'peraconfort' && booking.apartmentId === 'pera-confort') ||
                             (slug === 'peraduo' && booking.apartmentId === 'pera-duo') ||
                             (booking.shortName && booking.shortName.toLowerCase() === slug.toLowerCase());
          
          if (matchesSlug && booking.checkIn && booking.checkOut) {
            hasEvents = true;
            calendar.createEvent({
              id: doc.id,
              start: new Date(booking.checkIn),
              end: new Date(booking.checkOut),
              allDay: true,
              summary: 'Rezervare Site (Pera Apartments)',
              description: `Oaspete: ${booking.guestName}`,
              location: 'Pera Apartments, Cristian, Brasov',
              url: 'https://peraapartments.ro',
              busystatus: ICalEventBusyStatus.BUSY
            });
          }
        });

        // Add a placeholder event if empty to pass validation
        if (!hasEvents) {
          calendar.createEvent({
            id: `placeholder-${slug}`,
            start: new Date(),
            end: new Date(),
            allDay: true,
            summary: 'Sync Active',
            description: 'Pera Apartments Calendar Sync Connection',
            busystatus: ICalEventBusyStatus.FREE
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
        slug: req.params[0] || req.params.slug
      });
    }
  };

  app.get(/^\/api\/export-ical\/(.+)$/, handleIcalExport);
  app.get("/api/export-ical/:slug", handleIcalExport);

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

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      stripeKey: !!process.env.STRIPE_SECRET_KEY,
      gmailUser: !!process.env.GMAIL_USER,
      gmailPass: !!process.env.GMAIL_APP_PASSWORD,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      dbInitialized: !!db
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
