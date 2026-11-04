import type { UserRole } from "./roles.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        tokenVersion: number;
      };
    }
  }
}

export {};
