import type { Request, Response, NextFunction } from "express";

import * as queueService from "./queue.service.js";

import type { QueueStatus } from "./queue.model.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// POST: Create queue.
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const queue = await queueService.createQueue(
      getParam(req.params.businessId),
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Queue created successfully.",
      data: { queue },
    });
  } catch (error) {
    next(error);
  }
};

// GET: List business queues.
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queueDate =
      typeof req.query.queueDate === "string" ? req.query.queueDate : undefined;

    const queues = await queueService.listQueues(
      getParam(req.params.businessId),
      queueDate,
    );

    return res.status(200).json({
      success: true,
      message: "Queues retrieved successfully.",
      data: { queues },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get queue details.
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const queue = await queueService.getQueueById(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
    );

    return res.status(200).json({
      success: true,
      message: "Queue details retrieved successfully.",
      data: { queue },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Update queue settings.
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const queue = await queueService.updateQueue(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Queue updated successfully.",
      data: { queue },
    });
  } catch (error) {
    next(error);
  }
};



// PATCH: Update queue status.
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const queue = await queueService.updateQueueStatus(
      getParam(req.params.businessId),
      getParam(req.params.queueId),
      req.body.status as QueueStatus,
    );

    return res.status(200).json({
      success: true,
      message: "Queue status updated successfully.",
      data: { queue },
    });
  } catch (error) {
    next(error);
  }
};


