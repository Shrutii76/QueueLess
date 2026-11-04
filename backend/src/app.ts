import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to QueueLess API 🚀",
  });
});

// Health check
app.get("/api/v1/health", (_req: Request, res: Response) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "QueueLess API is healthy"
      : "Database is not connected",
    data: {
      server: "running",
      database: databaseConnected ? "connected" : "disconnected",
    },
  });
});

// Authentication routes
app.use("/api/v1/auth", authRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
