import jwt, { type SignOptions } from "jsonwebtoken";
import type { Response, CookieOptions } from "express";
import { env } from "../config/env.js";

export interface TokenPayload {
  id: string;
  email: string;
  role: "admin" | "customer";
  isAdmin: boolean;
  isPremium?: boolean;
}

export const ADMIN_COOKIE_NAME = "tech_inject_admin_token";
export const CUSTOMER_COOKIE_NAME = "tech_inject_auth_token";

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});

export function signToken(payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function setAuthCookie(res: Response, name: string, token: string): void {
  res.cookie(name, token, getCookieOptions());
}

export function clearAuthCookie(res: Response, name: string): void {
  res.clearCookie(name, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
}
