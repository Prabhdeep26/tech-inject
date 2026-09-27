import mongoose from "mongoose";
import { env } from "../config/env.js";
import { sanitizeSecrets } from "../middleware/errorHandler.js";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB using a singleton connection pool.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      const safeErr = err instanceof Error ? (err.stack || err.message) : String(err);
      console.error("❌ MongoDB connection error:", sanitizeSecrets(safeErr));
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    const safeError = error instanceof Error ? (error.stack || error.message) : String(error);
    console.error("Failed to establish MongoDB connection:", sanitizeSecrets(safeError));
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB singleton connection.
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("MongoDB connection closed gracefully");
  }
}

export default mongoose;
