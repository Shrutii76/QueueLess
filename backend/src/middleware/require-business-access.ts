import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Business from "../modules/businesses/business.model.js";
import StaffMembership, {
  type StaffPermission,
} from "../modules/users/staff-membership.model.js";

export const requireBusinessAccess = (requiredPermission?: StaffPermission) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const businessId = req.params.businessId;

      if (!businessId || !mongoose.isValidObjectId(businessId)) {
        res.status(400).json({
          success: false,
          message: "Invalid business ID",
        });
        return;
      }

      const business = await Business.findById(businessId);

      if (!business) {
        res.status(404).json({
          success: false,
          message: "Business not found",
        });
        return;
      }

      // Business owner has full access.
      if (business.owner.toString() === req.user.id) {
        next();
        return;
      }

      // Customers cannot access business-management endpoints.
      if (req.user.role !== "STAFF") {
        res.status(403).json({
          success: false,
          message: "You do not have access to this business",
        });
        return;
      }

      const membership = await StaffMembership.findOne({
        user: req.user.id,
        business: businessId,
        status: "ACTIVE",
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: "No active membership for this business",
        });
        return;
      }

      if (
        requiredPermission &&
        !membership.permissions.includes(requiredPermission)
      ) {
        res.status(403).json({
          success: false,
          message: "Required staff permission is missing",
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
