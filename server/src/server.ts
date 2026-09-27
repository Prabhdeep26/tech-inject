import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./db/mongoose.js";

async function bootstrap() {
  try {
    console.log(`Starting server in ${env.NODE_ENV} mode...`);

    // Connect to MongoDB
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server listening on port ${env.PORT} (http://localhost:${env.PORT})`);
      console.log(`🩺 Health check available at http://localhost:${env.PORT}/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("HTTP server closed.");
        try {
          await disconnectDB();
          process.exit(0);
        } catch (err) {
          console.error("Error during database disconnection:", err);
          process.exit(1);
        }
      });

      // Force close if graceful shutdown takes too long
      setTimeout(() => {
        console.error("Forcing shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
