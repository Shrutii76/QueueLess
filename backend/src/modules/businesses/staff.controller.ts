import type { Request, Response, NextFunction } from "express";

import * as staffService from "./staff.service.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// POST: Invite staff.
export const invite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await staffService.inviteStaff(
      getParam(req.params.businessId),
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Staff invitation created successfully.",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

// GET: List staff.
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.listStaff(
      getParam(req.params.businessId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Staff members retrieved successfully.",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

// POST: Accept invitation.
export const acceptInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await staffService.acceptInvitation(
      getParam(req.params.membershipId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Staff invitation accepted successfully.",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

// POST: Reject invitation.
export const rejectInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await staffService.rejectInvitation(
      getParam(req.params.membershipId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Staff invitation rejected successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Update permissions.
export const updatePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await staffService.updateStaffPermissions(
      getParam(req.params.businessId),
      getParam(req.params.staffId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Staff permissions updated successfully.",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Update status.
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await staffService.updateStaffStatus(
      getParam(req.params.businessId),
      getParam(req.params.staffId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Staff status updated successfully.",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Remove staff.
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await staffService.removeStaff(
      getParam(req.params.businessId),
      getParam(req.params.staffId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Staff member removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};
