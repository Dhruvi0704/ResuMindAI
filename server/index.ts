import "./env.ts";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.ts";
import { setupVite, serveStatic, log } from "./vite.ts";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import pgSessionStore from "connect-pg-simple";
import { connectDB } from "./db.ts";
import { setupAuth } from "./passport.ts";


const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Request logging logic...
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

const validateGemini = async () => {
  try {
    const { getGeminiModel, GEMINI_MODEL_NAME } = await import('./services/geminiService.ts');
    const model = getGeminiModel();
    await model.generateContent('hi');
    console.log(`✅ Gemini connected: ${GEMINI_MODEL_NAME}`);
  } catch (err: any) {
    console.error('❌ Gemini validation failed:', err.message);
    console.error('Check GEMINI_API_KEY in .env');
  }
};

validateGemini();

(async () => {
  // 1. Connect to DB
  try {
  await connectDB();
  console.log("✅ Database connected successfully");
} catch (error) {
  console.error("❌ Database startup error:", error);
}

  // 2. Setup Session
  const PostgresStore = pgSessionStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "resumind_secret",
      resave: false,
      saveUninitialized: false,
      store: new PostgresStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
      }
    })
  );

  // 3. Setup Passport
  setupAuth();
  app.use(passport.initialize());
  app.use(passport.session());

  // 4. Register Routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("🔥 Server Error:", err);
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  // ✅ Fix: Use IPv4 localhost in development to avoid ENOTSUP on Windows
  const host = app.get("env") === "development" ? "127.0.0.1" : "0.0.0.0";

  server.listen(port, host, () => {
    log(`✅ Server running on http://${host}:${port}`);
  });
})();
// Trigger restart 3
