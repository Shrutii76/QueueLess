import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import User from "../modules/users/user.model.js";

interface AccessTokenPayload {
  sub: string;
  role: string;
  tokenVersion: number;
  iss?: string;
  aud?: string | string[];
}

export interface AuthenticatedSocketData {
  user: {
    id: string;
    role: string;
    tokenVersion: number;
  };
}

export const authenticateSocket = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error("Authentication token required."));
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return next(new Error("Authentication configuration error."));
      }

      const decoded = jwt.verify(token, secret, {
        issuer: "queueless-api",
        audience: "queueless-mobile",
      }) as AccessTokenPayload;

      if (!decoded.sub || typeof decoded.tokenVersion !== "number") {
        return next(new Error("Invalid authentication token."));
      }

      const user = await User.findById(decoded.sub).select("+tokenVersion");

      if (!user || !user.isActive) {
        return next(new Error("User account is unavailable."));
      }

      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error("Session expired. Please log in again."));
      }

      if (user.role !== decoded.role) {
        return next(new Error("User role has changed. Please log in again."));
      }

      socket.data.user = {
        id: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
      } satisfies AuthenticatedSocketData["user"];

      next();
    } catch {
      next(new Error("Invalid or expired authentication token."));
    }
  });
};
