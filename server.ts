import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

console.log("Stripe Secret Key present:", !!process.env.STRIPE_SECRET_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { apartmentId, apartmentName, totalPrice, checkIn, checkOut, guestEmail, guestName } = req.body;

      console.log(`Attempting to create checkout session for ${apartmentName} (${apartmentId})`);

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("CRITICAL: STRIPE_SECRET_KEY is not defined in environment variables.");
        return res.status(500).json({ 
          error: "Configurația Stripe lipsește. Te rugăm să adaugi STRIPE_SECRET_KEY în setările aplicației (Settings > Secrets)." 
        });
      }

      if (!totalPrice || isNaN(Number(totalPrice)) || totalPrice <= 0) {
        console.error("Invalid totalPrice:", totalPrice);
        return res.status(400).json({ error: "Prețul total este invalid sau lipsește." });
      }

      if (!apartmentName) {
        return res.status(400).json({ error: "Numele apartamentului lipsește." });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const origin = req.headers.origin || `${protocol}://${host}`;

      console.log("Creating Stripe session...");
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
        success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/apartamente/${apartmentId}`,
        customer_email: guestEmail || undefined,
        metadata: {
          apartmentId,
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
      res.status(500).json({ error: error.message || "Eroare la crearea sesiunii de plată." });
    }
  });

  app.post("/api/verify-booking", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Session ID missing" });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        return res.status(400).json({ error: "Plata nu a fost finalizată." });
      }

      res.json({ 
        status: "success", 
        metadata: session.metadata,
        customer_email: session.customer_details?.email 
      });
    } catch (error: any) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
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
