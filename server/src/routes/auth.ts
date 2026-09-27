import { Router } from "express";
import { UserModel } from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  customerLoginSchema,
  customerRegisterSchema,
} from "../validations/auth.js";
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  CUSTOMER_COOKIE_NAME,
} from "../utils/jwt.js";

export const authRouter = Router();

/**
 * Returns a clean, sanitized customer object omitting password, hash, or internal fields
 */
function formatSafeUser(user: any) {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : (user.id || ""),
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    isPremium: Boolean(user.isPremium),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * POST /auth/register
 * Registers a new customer account, hashes password, and issues JWT httpOnly cookie.
 */
authRouter.post("/register", validateBody(customerRegisterSchema), async (req, res, next) => {
  try {
    const { email, password, isPremium } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return next(new AppError("An account with this email address already exists.", 409));
    }

    const newUser = await UserModel.create({
      email,
      password,
      isAdmin: false,
      isPremium: false,
    });

    const token = signToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: "customer",
      isAdmin: false,
      isPremium: newUser.isPremium,
    });

    setAuthCookie(res, CUSTOMER_COOKIE_NAME, token);

    res.status(201).json({
      status: "success",
      message: "Account registered successfully.",
      data: {
        token,
        user: formatSafeUser(newUser),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Validates customer credentials against database and sets httpOnly JWT cookie.
 */
authRouter.post("/login", validateBody(customerLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user including the hidden password field
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new AppError("Invalid email or password.", 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password.", 401));
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: "customer",
      isAdmin: user.isAdmin,
      isPremium: user.isPremium,
    });

    setAuthCookie(res, CUSTOMER_COOKIE_NAME, token);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      data: {
        token,
        user: formatSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Clears customer httpOnly session cookie.
 */
authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res, CUSTOMER_COOKIE_NAME);
  res.status(200).json({
    status: "success",
    message: "Logged out successfully.",
  });
});

/**
 * GET /auth/me
 * Protected endpoint returning current authenticated customer profile.
 */
authRouter.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: formatSafeUser(req.user),
    },
  });
});

/**
 * PATCH /auth/me
 * Protected endpoint allowing customer to update allowed profile fields.
 * STRICTLY PREVENTS customers from modifying their own isPremium or isAdmin fields.
 */
authRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (!user || !user._id) {
      return next(new AppError("User not found.", 404));
    }

    // Explicitly reject any attempt by customer to modify isPremium or isAdmin
    if ("isPremium" in req.body || "isAdmin" in req.body || "role" in req.body) {
      return next(
        new AppError(
          "Forbidden: Customers cannot modify their own subscription status (isPremium) or administrative privileges (isAdmin).",
          403
        )
      );
    }

    // Resolve user document from database
    const userDoc = await UserModel.findById(user._id);
    if (!userDoc) {
      return next(new AppError("User account not found.", 404));
    }

    // If updating password
    if (req.body.password) {
      if (typeof req.body.password !== "string" || req.body.password.length < 6) {
        return next(new AppError("Password must be at least 6 characters long.", 400));
      }
      userDoc.password = req.body.password;
      await userDoc.save();
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      data: {
        user: formatSafeUser(userDoc),
      },
    });
  } catch (error) {
    next(error);
  }
});

