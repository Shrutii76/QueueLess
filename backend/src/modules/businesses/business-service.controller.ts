import type { Request, Response, NextFunction } from "express";

import * as businessService from "./business-service.service.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// POST: Create service.
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const service = await businessService.createService(
      getParam(req.params.businessId),
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Business service created successfully.",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// GET: List services.
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await businessService.listServices(
      getParam(req.params.businessId),
    );

    return res.status(200).json({
      success: true,
      message: "Business services retrieved successfully.",
      data: { services },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get service details.
export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const service = await businessService.getServiceById(
      getParam(req.params.businessId),
      getParam(req.params.serviceId),
    );

    return res.status(200).json({
      success: true,
      message: "Business service retrieved successfully.",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Update service.
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const service = await businessService.updateService(
      getParam(req.params.businessId),
      getParam(req.params.serviceId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Business service updated successfully.",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Deactivate service.
export const deactivate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const service = await businessService.deactivateService(
      getParam(req.params.businessId),
      getParam(req.params.serviceId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Business service deactivated successfully.",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};
