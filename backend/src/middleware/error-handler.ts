import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/app-error.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  const err = error as {
    code?: number;
    name?: string;
    message?: string;
    keyPattern?: Record<string, unknown>;
  };

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with these details already exists.",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID or value provided.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};
