import { Router } from "express";
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import * as queueController from "./queue.controller.js";

import {
  createQueueSchema,
  updateQueueSchema,
  updateQueueStatusSchema,
} from "./queue.validation.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireBusinessAccess } from "../../middleware/require-business-access.js";

const router = Router();

// Reusable Zod validation middleware.
const validate = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
};

// Owner: create queue.
router.post(
  "/businesses/:businessId/queues",
  authenticate,
  authorize("BUSINESS_OWNER"),
  validate(createQueueSchema),
  queueController.create,
);

// Public: list queues.
router.get("/businesses/:businessId/queues", queueController.list);

// Public: queue details.
router.get("/businesses/:businessId/queues/:queueId", queueController.getById);

// Owner: update queue settings.
router.patch(
  "/businesses/:businessId/queues/:queueId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  validate(updateQueueSchema),
  queueController.update,
);

// Owner or active staff with PAUSE_QUEUE: pause/resume/close.
// Controller must restrict CLOSED to business owners.
router.patch(
  "/businesses/:businessId/queues/:queueId/status",
  authenticate,
  requireBusinessAccess("PAUSE_QUEUE"),
  validate(updateQueueStatusSchema),
  queueController.updateStatus,
);

export default router;
