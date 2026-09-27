import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "./errorHandler.js";
import {
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  verifyToken,
  type TokenPayload,
} from "../utils/jwt.js";
import { UserModel } from "../models/User.js";

/**
 * Extract token from either the designated cookie or Bearer authorization header
 */
function extractToken(req: Request, cookieName: string): string | null {
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware: requireAdmin
 * Verifies that the request possesses a valid Admin JWT token via httpOnly cookie or Bearer header.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req, ADMIN_COOKIE_NAME);

    if (!token) {
      return next(new AppError("Admin authentication required. Please log in.", 401));
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(new AppError("Invalid or expired admin session. Please log in again.", 401));
    }

    if (!payload.isAdmin || payload.role !== "admin") {
      return next(new AppError("Access denied: Administrative privileges required.", 403));
    }

    req.admin = payload;
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: requireAuth
 * Verifies that the request possesses a valid customer JWT token and resolves the user in DB.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req, CUSTOMER_COOKIE_NAME);

    if (!token) {
      return next(new AppError("Authentication required. Please log in.", 401));
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(new AppError("Invalid or expired session. Please log in again.", 401));
    }

    if (payload.role !== "customer" || !mongoose.isValidObjectId(payload.id)) {
      return next(new AppError("Invalid customer session. Please log in again.", 401));
    }

    // Resolve user from database
    const user = await UserModel.findById(payload.id);
    if (!user) {
      return next(new AppError("User account not found or has been deactivated.", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export interface RequesterAuth {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  userId?: string;
  email?: string;
}

/**
 * Resolves authentication context dynamically without throwing 401.
 * Checks cookies and Bearer headers for Admin or Customer credentials.
 * Re-checks customer existence and isPremium status directly in MongoDB on every call.
 */
export async function resolveRequesterAuth(req: Request): Promise<RequesterAuth> {
  // 1. Check for Admin token
  const adminToken = extractToken(req, ADMIN_COOKIE_NAME);
  if (adminToken) {
    try {
      const payload = verifyToken(adminToken);
      if (payload.isAdmin && payload.role === "admin") {
        return {
          isAuthenticated: true,
          isAdmin: true,
          isPremium: true,
          userId: payload.id,
          email: payload.email,
        };
      }
    } catch {
      // Ignore invalid admin token and proceed
    }
  }

  // 2. Check for Customer token
  const customerToken = extractToken(req, CUSTOMER_COOKIE_NAME);
  if (customerToken) {
    try {
      const payload = verifyToken(customerToken);
      if (mongoose.isValidObjectId(payload.id)) {
        // Fresh database query on every request
        const user = await UserModel.findById(payload.id).select("email isAdmin isPremium");
        if (user) {
          return {
            isAuthenticated: true,
            isAdmin: user.isAdmin,
            isPremium: user.isPremium || user.isAdmin,
            userId: user._id.toString(),
            email: user.email,
          };
        }
      }
    } catch {
      // Ignore invalid customer token
    }
  }

  return {
    isAuthenticated: false,
    isAdmin: false,
    isPremium: false,
  };
}

