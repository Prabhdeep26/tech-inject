import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const customerLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const customerRegisterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  isPremium: z.boolean().optional().default(false),
});

export const customerUpdateProfileSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long").optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerUpdateProfileInput = z.infer<typeof customerUpdateProfileSchema>;

