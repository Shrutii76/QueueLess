import type { Request, Response, NextFunction } from "express";

import * as queueEntryService from "./queue-entry.service.js";

const getParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// POST: Join queue.
export const join = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await queueEntryService.joinQueue(
      getParam(req.params.queueId),
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "You have successfully joined the queue.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Customer queue history.
export const getMine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entries = await queueEntryService.getMyQueueEntries(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Your queue entries retrieved successfully.",
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
};

// GET: One customer entry.
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueEntryService.getMyQueueEntry(
      getParam(req.params.entryId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Queue entry retrieved successfully.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Position and estimated waiting time.
export const getPosition = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const position = await queueEntryService.getQueuePosition(
      getParam(req.params.entryId),
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      message: "Queue position retrieved successfully.",
      data: { position },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Cancel entry.
export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await queueEntryService.cancelQueueEntry(
      getParam(req.params.entryId),
      req.user!.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Queue entry cancelled successfully.",
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};
