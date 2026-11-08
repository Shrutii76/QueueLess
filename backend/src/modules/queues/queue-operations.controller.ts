import type { Request, Response, NextFunction } from "express";

import * as queueOperationsService from "./queue-operations.service.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// GET: List queue entries.
export const getEntries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entries = await queueOperationsService.getQueueEntries(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
    );

    return res.status(200).json({
      success: true,
      message: "Queue entries retrieved successfully.",
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
};

// POST: Call next customer.
export const callNext = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueOperationsService.callNextCustomer(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
    );

    return res.status(200).json({
      success: true,
      message: "Next customer called successfully.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark customer as serving.
export const serving = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueOperationsService.markCustomerServing(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
      getParam(req.params.entryId),
    );

    return res.status(200).json({
      success: true,
      message: "Customer service started.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Complete service.
export const complete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueOperationsService.completeCustomerService(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
      getParam(req.params.entryId),
    );

    return res.status(200).json({
      success: true,
      message: "Customer service completed.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark no-show.
export const noShow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueOperationsService.markCustomerNoShow(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
      getParam(req.params.entryId),
    );

    return res.status(200).json({
      success: true,
      message: "Customer marked as no-show.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};
