import { Router } from "express";

import * as queueOperationsController from "./queue-operations.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { requireBusinessAccess } from "../../middleware/require-business-access.js";

const router = Router();

// Staff or owner: view queue entries.
router.get(
  "/businesses/:businessId/queues/:queueId/entries",
  authenticate,
  requireBusinessAccess("VIEW_QUEUE"),
  queueOperationsController.getEntries,
);

// Staff or owner: call next customer.
router.post(
  "/businesses/:businessId/queues/:queueId/call-next",
  authenticate,
  requireBusinessAccess("CALL_NEXT"),
  queueOperationsController.callNext,
);

// Staff or owner: mark customer as serving.
router.patch(
  "/businesses/:businessId/queues/:queueId/entries/:entryId/serving",
  authenticate,
  requireBusinessAccess("UPDATE_ENTRY"),
  queueOperationsController.serving,
);

// Staff or owner: complete service.
router.patch(
  "/businesses/:businessId/queues/:queueId/entries/:entryId/complete",
  authenticate,
  requireBusinessAccess("UPDATE_ENTRY"),
  queueOperationsController.complete,
);

// Staff or owner: mark no-show.
router.patch(
  "/businesses/:businessId/queues/:queueId/entries/:entryId/no-show",
  authenticate,
  requireBusinessAccess("UPDATE_ENTRY"),
  queueOperationsController.noShow,
);

export default router;
