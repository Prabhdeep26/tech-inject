import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Redacts potential secrets, credentials, and sensitive tokens from error messages and stack traces
 */
export function sanitizeSecrets(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    // Redact MongoDB connection URIs with embedded credentials
    .replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, "mongodb$1://***:***@")
    // Redact Bearer tokens in headers/messages
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    // Redact JWT tokens
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/gi, "[REDACTED_JWT]")
    // Redact password or secret key fields in json/query strings
    .replace(/(["']?(?:password|secret|token|admin_secret)["']?\s*[:=]\s*)(?:["'][^"']+["']|[^\s,}&]+)/gi, '$1"[REDACTED]"');
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const err = new AppError(`Not Found: ${req.method} ${req.originalUrl}`, 404);
  next(err);
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // In production, unhandled (non-operational) 500 errors should never leak internal details
  const rawMessage = (isOperational || env.NODE_ENV !== "production")
    ? (err.message || "An unexpected error occurred.")
    : "An unexpected internal server error occurred.";

  const message = sanitizeSecrets(rawMessage);

  const response: {
    status: "error";
    statusCode: number;
    message: string;
    stack?: string;
  } = {
    status: "error",
    statusCode,
    message,
  };

  if (env.NODE_ENV !== "production" && err.stack) {
    response.stack = sanitizeSecrets(err.stack);
  }

  res.status(statusCode).json(response);
};
