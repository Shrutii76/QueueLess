import { Router, type RequestHandler } from "express";
import { type ZodType } from "zod";

import * as businessController from "./business.controller.js";
import * as businessServiceController from "./business-service.controller.js";
import * as operatingHoursController from "./operating-hours.controller.js";
import * as staffController from "./staff.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireBusinessAccess } from "../../middleware/require-business-access.js";
import {
  createBusinessServiceSchema,
  updateBusinessServiceSchema,
} from "./business-service.validation.js"; 
import {
  setOperatingHoursSchema,
  updateOperatingDaySchema,
  WEEK_DAYS,
} from "./operating-hours.validation.js";
import {
  createBusinessSchema,
  updateBusinessSchema,
} from "./business.validation.js";
import {
  inviteStaffSchema,
  updateStaffPermissionsSchema,
  updateStaffStatusSchema,
} from "./staff.validation.js";

const router = Router();

const validate = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
};

// Create business: only business owners.
router.post(
  "/",
  authenticate,
  authorize("BUSINESS_OWNER"),
  validate(createBusinessSchema),
  businessController.create,
);

// Discover active businesses.
router.get("/", businessController.list);

// Public active business profile.
router.get("/:businessId", businessController.getOne);

// Owner or staff with VIEW_QUEUE permission.
router.get(
  "/:businessId/manage",
  authenticate,
  requireBusinessAccess("VIEW_QUEUE"),
  businessController.getForManagement,
);


// ========================================
// BUSINESS SERVICES
// ========================================

// POST: Create a service.
// Only the owner of this business can add services.
router.post(
  "/:businessId/services",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(createBusinessServiceSchema),
  businessServiceController.create
);

// GET: List active services.
router.get(
  "/:businessId/services",
  businessServiceController.list
);

// GET: Get one active service.
router.get(
  "/:businessId/services/:serviceId",
  businessServiceController.getOne
);

// PATCH: Update service.
// Owner only.
router.patch(
  "/:businessId/services/:serviceId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(updateBusinessServiceSchema),
  businessServiceController.update
);

// DELETE: Deactivate service.
// Owner only.
router.delete(
  "/:businessId/services/:serviceId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  businessServiceController.deactivate
);

// Only the owner of this business can update it.
router.patch(
  "/:businessId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(updateBusinessSchema),
  businessController.update,
);


// ========================================
// OPERATING HOURS
// ========================================

// GET: Public business operating hours.
router.get(
  "/:businessId/operating-hours",
  operatingHoursController.get
);

// PUT: Replace complete weekly schedule.
// Owner only.
router.put(
  "/:businessId/operating-hours",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(setOperatingHoursSchema),
  operatingHoursController.set
);

// PATCH: Update one day.
// Owner only.
router.patch(
  "/:businessId/operating-hours/:day",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  (req, res, next) => {
    const day = Array.isArray(req.params.day)
      ? req.params.day[0]
      : req.params.day;

    if (!day || !WEEK_DAYS.includes(day.toUpperCase() as typeof WEEK_DAYS[number])) {
      return res.status(400).json({
        success: false,
        message: "Invalid day. Use MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY or SUNDAY.",
      });
    }

    next();
  },
  validate(updateOperatingDaySchema),
  operatingHoursController.updateDay
);

// ========================================
// STAFF MANAGEMENT
// ========================================

// Owner: invite staff.
router.post(
  "/:businessId/staff",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(inviteStaffSchema),
  staffController.invite
);

// Owner: list staff and invitations.
router.get(
  "/:businessId/staff",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  staffController.list
);

// Invited user: accept invitation.
router.post(
  "/staff/invitations/:membershipId/accept",
  authenticate,
  staffController.acceptInvitation
);

// Invited user: reject invitation.
router.post(
  "/staff/invitations/:membershipId/reject",
  authenticate,
  staffController.rejectInvitation
);

// Owner: update staff permissions.
router.patch(
  "/:businessId/staff/:staffId/permissions",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(updateStaffPermissionsSchema),
  staffController.updatePermissions
);

// Owner: activate or deactivate staff.
router.patch(
  "/:businessId/staff/:staffId/status",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  validate(updateStaffStatusSchema),
  staffController.updateStatus
);

// Owner: remove staff.
router.delete(
  "/:businessId/staff/:staffId",
  authenticate,
  authorize("BUSINESS_OWNER"),
  requireBusinessAccess("VIEW_QUEUE"),
  staffController.remove
);

export default router;
