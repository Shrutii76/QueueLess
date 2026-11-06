import mongoose from "mongoose";

import Queue from "./queue.model.js";
import Business from "../businesses/business.model.js";
import { AppError } from "../../utils/app-error.js";

import type { CreateQueueInput, UpdateQueueInput } from "./queue.validation.js";

import type { QueueStatus } from "./queue.model.js";

const validateBusinessId = (businessId: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }
};

const validateQueueId = (queueId: string) => {
  if (!mongoose.isValidObjectId(queueId)) {
    throw new AppError("Invalid queue ID.", 400);
  }
};

// 1. Create a queue.
export const createQueue = async (
  businessId: string,
  ownerId: string,
  data: CreateQueueInput,
) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    owner: ownerId,
    status: "ACTIVE",
  });

  if (!business) {
    throw new AppError(
      "Active business not found or you do not own this business.",
      404,
    );
  }

  // Verify that the selected service belongs to this business.
  const service = business.services.find(
    (item) => item._id.toString() === data.serviceId && item.isActive,
  );

  if (!service) {
    throw new AppError("Active service not found in this business.", 404);
  }

  try {
    const queue = await Queue.create({
      business: business._id,
      serviceId: service._id,
      queueDate: data.queueDate,
      maxCapacity: data.maxCapacity ?? 100,
      estimatedServiceMinutes: data.estimatedServiceMinutes ?? service.duration,
      allowOnlineJoining: data.allowOnlineJoining ?? true,
      status: "OPEN",
      lastTokenNumber: 0,
      currentTokenNumber: 0,
      createdBy: ownerId,
    });

    return queue;
  } catch (error) {
    // Unique index: one queue per business/service/date.
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new AppError(
        "A queue already exists for this service on this date.",
        409,
      );
    }

    throw error;
  }
};

// 2. List queues for a business.
export const listQueues = async (businessId: string, queueDate?: string) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).select("_id");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  const filter: Record<string, unknown> = {
    business: business._id,
  };

  if (queueDate) {
    filter.queueDate = queueDate;
  }

  return Queue.find(filter)
    .sort({ queueDate: -1, createdAt: -1 })
    .populate("business", "name category address");
};

// 3. Get queue details.
export const getQueueById = async (businessId: string, queueId: string) => {
  validateBusinessId(businessId);
  validateQueueId(queueId);

  const queue = await Queue.findOne({
    _id: queueId,
    business: businessId,
  }).populate("business", "name category address");

  if (!queue) {
    throw new AppError("Queue not found.", 404);
  }

  return queue;
};

// 4. Update queue settings.
export const updateQueue = async (
  businessId: string,
  queueId: string,
  ownerId: string,
  data: UpdateQueueInput,
) => {
  validateBusinessId(businessId);
  validateQueueId(queueId);

  const business = await Business.findOne({
    _id: businessId,
    owner: ownerId,
  }).select("_id");

  if (!business) {
    throw new AppError(
      "Business not found or you do not own this business.",
      404,
    );
  }

  const queue = await Queue.findOne({
    _id: queueId,
    business: businessId,
  });

  if (!queue) {
    throw new AppError("Queue not found.", 404);
  }

  if (queue.status === "CLOSED") {
    throw new AppError("Closed queues cannot be updated.", 409);
  }

  if (
    data.maxCapacity !== undefined &&
    data.maxCapacity < queue.lastTokenNumber
  ) {
    throw new AppError(
      "Maximum capacity cannot be less than the number of tokens already issued.",
      400,
    );
  }

  if (data.maxCapacity !== undefined) {
    queue.maxCapacity = data.maxCapacity;
  }

  if (data.estimatedServiceMinutes !== undefined) {
    queue.estimatedServiceMinutes = data.estimatedServiceMinutes;
  }

  if (data.allowOnlineJoining !== undefined) {
    queue.allowOnlineJoining = data.allowOnlineJoining;
  }

  await queue.save();

  return queue;
};

// 5. Change queue status.
export const updateQueueStatus = async (
  businessId: string,
  queueId: string,
  status: QueueStatus,
) => {
  validateBusinessId(businessId);
  validateQueueId(queueId);

  const queue = await Queue.findOne({
    _id: queueId,
    business: businessId,
  });

  if (!queue) {
    throw new AppError("Queue not found.", 404);
  }

  if (queue.status === "CLOSED") {
    throw new AppError("This queue is already closed.", 409);
  }

  if (status === "OPEN" && queue.status !== "PAUSED") {
    throw new AppError("Only paused queues can be reopened.", 409);
  }

  if (status === "CLOSED") {
    queue.closedAt = new Date();
  }

  queue.status = status;

  await queue.save();

  return queue;
};
