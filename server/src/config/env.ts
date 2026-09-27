import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ADMIN_EMAIL: z.string().email("Invalid admin email format").default("admin@tech-inject.dev"),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("❌ Invalid environment variables:\n" + errorDetails);
    throw new Error("Invalid server environment configuration");
  }

  const data = result.data;
  if (!data.ADMIN_PASSWORD_HASH && !data.ADMIN_SECRET) {
    console.warn("⚠️ Warning: Neither ADMIN_PASSWORD_HASH nor ADMIN_SECRET is set. Using default development secret.");
    data.ADMIN_SECRET = "admin123";
  }

  return data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
