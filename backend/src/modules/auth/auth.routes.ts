import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { register, login, me, logout } from "./auth.controller.js";

import { registerSchema, loginSchema } from "./auth.validation.js";

import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});

// Zod validation middleware
const validate =
  (schema: typeof registerSchema | typeof loginSchema) =>
  (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };

// Public routes
router.post("/register", authLimiter, validate(registerSchema), register);

router.post("/login", authLimiter, validate(loginSchema), login);

// Protected routes
router.get("/me", authenticate, me);

router.post("/logout", authenticate, logout);

export default router;
