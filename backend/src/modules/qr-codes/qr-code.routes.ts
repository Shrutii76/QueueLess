import { Router } from "express";

import * as qrCodeController from "./qr-code.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

// Public: resolve a scanned QR code.
// Keep this route separate from authenticated management routes.
router.get("/qr/:code", qrCodeController.resolveQR);

// Owner-only: generate a service QR.
router.post(
  "/businesses/:businessId/services/:serviceId/qr",
  authenticate,
  authorize("BUSINESS_OWNER"),
  qrCodeController.generateQR,
);

// Owner-only: list business QR codes.
router.get(
  "/businesses/:businessId/qr",
  authenticate,
  authorize("BUSINESS_OWNER"),
  qrCodeController.listQRCodes,
);

// Owner-only: get QR details.
router.get(
  "/businesses/:businessId/qr/:qrId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  qrCodeController.getQRCode,
);

// Owner-only: deactivate QR.
router.patch(
  "/businesses/:businessId/qr/:qrId/deactivate",
  authenticate,
  authorize("BUSINESS_OWNER"),
  qrCodeController.deactivateQR,
);

// Owner-only: regenerate service QR.
router.post(
  "/businesses/:businessId/services/:serviceId/qr/regenerate",
  authenticate,
  authorize("BUSINESS_OWNER"),
  qrCodeController.regenerateQR,
);

export default router;
