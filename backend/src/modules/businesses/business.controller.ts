import type { Request, Response, NextFunction } from "express";

import * as businessService from "./business.service.js";

const getBusinessId = (req: Request): string => {
  const businessId = req.params.businessId;

  return Array.isArray(businessId) ? (businessId[0] ?? "") : businessId;
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const business = await businessService.createBusiness(
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Business created successfully.",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await businessService.listBusinesses({
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,

      category:
        typeof req.query.category === "string" ? req.query.category : undefined,

      city: typeof req.query.city === "string" ? req.query.city : undefined,

      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });

    return res.status(200).json({
      success: true,
      message: "Businesses retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const business = await businessService.getBusinessById(
      getBusinessId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Business retrieved successfully.",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

export const getForManagement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const business = await businessService.getBusinessForManagement(
      getBusinessId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Business management details retrieved successfully.",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const business = await businessService.updateBusiness(
      getBusinessId(req),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Business updated successfully.",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};
