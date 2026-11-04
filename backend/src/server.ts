import "dotenv/config";

import http from "node:http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Validate environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    // Connect to MongoDB
    await connectDatabase();

    // Create HTTP server
    const server = http.createServer(app);

    // Start server
    server.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("🚀 QueueLess Backend Started");
      console.log("-----------------------------------");
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/v1/health`);
      console.log("Database: MongoDB Connected");
      console.log("-----------------------------------");
    });

    // Handle unexpected server errors
    server.on("error", (error) => {
      console.error("HTTP Server Error:", error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down QueueLess server...");

      server.close(async () => {
        await import("mongoose").then(({ default: mongoose }) =>
          mongoose.disconnect(),
        );

        console.log("Server stopped successfully");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
