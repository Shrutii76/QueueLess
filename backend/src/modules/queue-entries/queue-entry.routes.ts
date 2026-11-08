import { Router } from "express";
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import * as queueEntryController from "./queue-entry.controller.js";

import {
  joinQueueSchema,
  cancelQueueEntrySchema,
} from "./queue-entry.validation.js";

import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Local Zod validation helper.
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

// Customer: join queue.
router.post(
  "/queues/:queueId/entries",
  authenticate,
  validate(joinQueueSchema),
  queueEntryController.join,
);

// Customer: view their queue history.
router.get("/queue-entries/me", authenticate, queueEntryController.getMine);

// Customer: view their queue position.
router.get(
  "/queue-entries/:entryId/position",
  authenticate,
  queueEntryController.getPosition,
);

// Customer: view their entry.
router.get(
  "/queue-entries/:entryId",
  authenticate,
  queueEntryController.getById,
);

// Customer: cancel their entry.
router.patch(
  "/queue-entries/:entryId/cancel",
  authenticate,
  validate(cancelQueueEntrySchema),
  queueEntryController.cancel,
);

export default router;
