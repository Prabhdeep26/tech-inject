import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { componentsRouter } from "./routes/components.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./db/mongoose.js";

export const app = express();

// Ensure DB connection for serverless invocations (e.g. Vercel)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Base middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedList = env.CORS_ORIGIN.split(",").map((o) => o.trim());
      if (
        env.CORS_ORIGIN === "*" ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        allowedList.includes(origin)
      ) {
        return callback(null, true);
      }

      callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/components", componentsRouter);

// Root route for quick verification
app.get("/", (_req, res) => {
  res.json({
    name: "tech-inject API",
    version: "0.0.0",
    endpoints: {
      health: "/health",
      auth: {
        login: "POST /auth/login",
        register: "POST /auth/register",
        logout: "POST /auth/logout",
        me: "GET /auth/me",
      },
      admin: {
        login: "POST /admin/login",
        logout: "POST /admin/logout",
        me: "GET /admin/me",
      },
    },
  });
});

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
