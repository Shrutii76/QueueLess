import type { Request, Response, NextFunction } from "express";

import User from "../modules/users/user.model.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
      return;
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
      return;
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select("+tokenVersion");

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
      return;
    }

    if ((user.tokenVersion ?? 0) !== decoded.tokenVersion) {
      res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }

    if (user.role !== decoded.role) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication session",
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
