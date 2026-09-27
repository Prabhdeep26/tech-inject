import { Router } from "express";
import mongoose from "mongoose";

export const healthRouter = Router();

const mongoStateMap: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

healthRouter.get("/", (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  const isDbHealthy = mongoState === 1;

  const healthPayload = {
    status: isDbHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: mongoStateMap[mongoState] ?? "unknown",
        readyState: mongoState,
      },
      server: {
        status: "up",
      },
    },
  };

  const statusCode = isDbHealthy ? 200 : 503;
  res.status(statusCode).json(healthPayload);
});
