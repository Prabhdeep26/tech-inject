export { app } from "./app.js";
export { env } from "./config/env.js";
export { connectDB, disconnectDB } from "./db/mongoose.js";
export { AppError, errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
export { validateBody, validateQuery } from "./middleware/validate.js";
export { requireAdmin, requireAuth } from "./middleware/auth.js";
export * from "./utils/jwt.js";
export * from "./models/index.js";
export * from "./validations/index.js";
export { authRouter } from "./routes/auth.js";
export { adminRouter } from "./routes/admin.js";
export { healthRouter } from "./routes/health.js";

import { config } from "@tech-inject/config";
import type { BaseEntity } from "@tech-inject/types";

export interface ServerStatus extends BaseEntity {
  status: "ok" | "degraded" | "down";
  app: string;
}

export function getServerStatus(): ServerStatus {
  return {
    id: "server-1",
    status: "ok",
    app: config.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
