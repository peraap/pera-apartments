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

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API Router
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  apiRouter.post("/create-checkout-session", async (req, res) => {
    try {
      const { apartmentId, apartmentName, totalPrice, checkIn, checkOut, guestEmail, guestName } = req.body;

      console.log(`Creating session for ${apartmentName}`);

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ 
          error: "STRIPE_SECRET_KEY is missing in server environment." 
        });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const origin = req.headers.origin || `${protocol}://${host}`;

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
      res.status(500).json({ error: error.message || "Eroare Stripe." });
    }
  });

  apiRouter.post("/verify-booking", async (req, res) => {
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

  app.use("/api", apiRouter);

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
