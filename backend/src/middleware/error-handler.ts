import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("API Error:", error);

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: "Database validation failed",
      errors: Object.values(error.errors).map((item) => item.message),
    });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({
      success: false,
      message: "An account with these details already exists",
    });
    return;
  }

  if (error.message === "An account with these details already exists") {
    res.status(409).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.message === "Invalid email/phone or password") {
    res.status(401).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.message === "Your account is inactive") {
    res.status(403).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.message === "User account not found or inactive") {
    res.status(404).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
