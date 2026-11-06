import type { Request, Response, NextFunction } from "express";

import * as operatingHoursService from "./operating-hours.service.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// GET: Retrieve operating hours.
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const operatingHours = await operatingHoursService.getOperatingHours(
      getParam(req.params.businessId),
    );

    return res.status(200).json({
      success: true,
      message: "Operating hours retrieved successfully.",
      data: { operatingHours },
    });
  } catch (error) {
    next(error);
  }
};

// PUT: Replace weekly operating hours.
export const set = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const operatingHours = await operatingHoursService.setOperatingHours(
      getParam(req.params.businessId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Operating hours updated successfully.",
      data: { operatingHours },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Update one day.
export const updateDay = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dayFromUrl = getParam(req.params.day).toUpperCase();

    if (req.body.day !== dayFromUrl) {
      return res.status(400).json({
        success: false,
        message: "The day in the URL must match the day in the request body.",
      });
    }

    const operatingHours = await operatingHoursService.updateOperatingDay(
      getParam(req.params.businessId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: `${dayFromUrl} operating hours updated successfully.`,
      data: { operatingHours },
    });
  } catch (error) {
    next(error);
  }
};
