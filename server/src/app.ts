import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { componentsRouter } from "./routes/components.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const app = express();

// Base middleware
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
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
