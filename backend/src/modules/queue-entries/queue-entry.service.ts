import mongoose from "mongoose";

import Queue from "../queues/queue.model.js";
import QueueEntry from "./queue-entry.model.js";

import {
  emitQueueEvent,
  emitCustomerEvent,
  broadcastQueuePositions,
} from "../../sockets/socket.js";

import { SOCKET_EVENTS } from "../../sockets/socket-events.js";
import { AppError } from "../../utils/app-error.js";

import type {
  JoinQueueInput,
  CancelQueueEntryInput,
} from "./queue-entry.validation.js";

const ACTIVE_STATUSES = ["WAITING", "CALLED", "SERVING"] as const;

// Broadcast queue position changes without allowing a Socket.IO
// failure to turn a successful database operation into an API failure.
const safelyBroadcastPositions = async (
  queueId: string,
  businessId: string,
): Promise<void> => {
  try {
    await broadcastQueuePositions(queueId, businessId);
  } catch (error) {
    console.error("Queue position broadcast failed:", error);
  }
};

// 1. Customer joins a queue.
export const joinQueue = async (
  queueId: string,
  customerId: string,
  data: JoinQueueInput,
) => {
  if (!mongoose.isValidObjectId(queueId)) {
    throw new AppError("Invalid queue ID.", 400);
  }

  if (!mongoose.isValidObjectId(customerId)) {
    throw new AppError("Invalid customer ID.", 400);
  }

  const queue = await Queue.findById(queueId);

  if (!queue) {
    throw new AppError("Queue not found.", 404);
  }

  if (queue.status !== "OPEN") {
    throw new AppError("This queue is not currently accepting customers.", 409);
  }

  if (!queue.allowOnlineJoining) {
    throw new AppError("Online joining is disabled for this queue.", 403);
  }

  const existingEntry = await QueueEntry.findOne({
    queue: queue._id,
    customer: customerId,
    isActive: true,
  });

  if (existingEntry) {
    throw new AppError("You have already joined this queue.", 409);
  }

  // Atomically reserve the next token number.
  const updatedQueue = await Queue.findOneAndUpdate(
    {
      _id: queue._id,
      status: "OPEN",
      allowOnlineJoining: true,
      $expr: {
        $lt: ["$lastTokenNumber", "$maxCapacity"],
      },
    },
    {
      $inc: {
        lastTokenNumber: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedQueue) {
    const latestQueue = await Queue.findById(queueId);

    if (!latestQueue) {
      throw new AppError("Queue not found.", 404);
    }

    if (latestQueue.status !== "OPEN") {
      throw new AppError(
        "This queue is not currently accepting customers.",
        409,
      );
    }

    if (!latestQueue.allowOnlineJoining) {
      throw new AppError("Online joining is disabled for this queue.", 403);
    }

    throw new AppError("This queue has reached its maximum capacity.", 409);
  }

  const tokenNumber = updatedQueue.lastTokenNumber;

  let entry;

  try {
    entry = await QueueEntry.create({
      queue: updatedQueue._id,
      business: updatedQueue.business,
      customer: customerId,
      tokenNumber,
      status: "WAITING",
      joinedAt: new Date(),
      isActive: true,
      notes: data.notes,
    });
  } catch (error) {
    // Protect against simultaneous duplicate join requests.
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new AppError("You have already joined this queue.", 409);
    }

    throw error;
  }

  const payload = {
    entryId: entry._id.toString(),
    queueId: updatedQueue._id.toString(),
    businessId: updatedQueue.business.toString(),
    customerId,
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    joinedAt: entry.joinedAt,
  };

  emitQueueEvent(
    queueId,
    updatedQueue.business.toString(),
    SOCKET_EVENTS.ENTRY_JOINED,
    payload,
  );

  emitCustomerEvent(customerId, SOCKET_EVENTS.ENTRY_JOINED, payload);

  await safelyBroadcastPositions(queueId, updatedQueue.business.toString());

  return entry;
};

// 2. Get customer's queue entries.
export const getMyQueueEntries = async (customerId: string) => {
  return QueueEntry.find({
    customer: customerId,
  })
    .populate("queue")
    .populate("business", "name category address")
    .sort({ joinedAt: -1 })
    .limit(50);
};

// 3. Get one entry belonging to the authenticated customer.
export const getMyQueueEntry = async (entryId: string, customerId: string) => {
  if (!mongoose.isValidObjectId(entryId)) {
    throw new AppError("Invalid queue entry ID.", 400);
  }

  const entry = await QueueEntry.findOne({
    _id: entryId,
    customer: customerId,
  })
    .populate("queue")
    .populate("business", "name category address");

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  return entry;
};

// 4. Calculate current position and estimated waiting time.
export const getQueuePosition = async (entryId: string, customerId: string) => {
  if (!mongoose.isValidObjectId(entryId)) {
    throw new AppError("Invalid queue entry ID.", 400);
  }

  const entry = await QueueEntry.findOne({
    _id: entryId,
    customer: customerId,
  });

  if (!entry) {
    throw new AppError("Queue entry not found.", 404);
  }

  if (!entry.isActive) {
    throw new AppError("This queue entry is no longer active.", 409);
  }

  const queue = await Queue.findById(entry.queue);

  if (!queue) {
    throw new AppError("Queue not found.", 404);
  }

  const peopleAhead = await QueueEntry.countDocuments({
    queue: entry.queue,
    tokenNumber: { $lt: entry.tokenNumber },
    status: { $in: ACTIVE_STATUSES },
    isActive: true,
  });

  const position = peopleAhead + 1;

  const estimatedWaitingMinutes =
    entry.status === "SERVING"
      ? 0
      : peopleAhead * queue.estimatedServiceMinutes;

  return {
    entryId: entry._id,
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    position,
    peopleAhead,
    estimatedWaitingMinutes,
    queueStatus: queue.status,
    queueDate: queue.queueDate,
  };
};

// 5. Customer cancels their entry.
export const cancelQueueEntry = async (
  entryId: string,
  customerId: string,
  data: CancelQueueEntryInput,
) => {
  if (!mongoose.isValidObjectId(entryId)) {
    throw new AppError("Invalid queue entry ID.", 400);
  }

  const entry = await QueueEntry.findOneAndUpdate(
    {
      _id: entryId,
      customer: customerId,
      isActive: true,
      status: "WAITING",
    },
    {
      $set: {
        status: "CANCELLED",
        isActive: false,
        cancelledAt: new Date(),
        cancellationReason: data.reason,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!entry) {
    const existingEntry = await QueueEntry.findOne({
      _id: entryId,
      customer: customerId,
    });

    if (!existingEntry) {
      throw new AppError("Queue entry not found.", 404);
    }

    throw new AppError("Only waiting queue entries can be cancelled.", 409);
  }

  const queue = await Queue.findById(entry.queue);

  const payload = {
    entryId: entry._id.toString(),
    queueId: entry.queue.toString(),
    businessId: entry.business.toString(),
    customerId,
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    cancelledAt: entry.cancelledAt,
    cancellationReason: entry.cancellationReason,
  };

  emitQueueEvent(
    entry.queue.toString(),
    entry.business.toString(),
    SOCKET_EVENTS.ENTRY_CANCELLED,
    payload,
  );

  emitCustomerEvent(customerId, SOCKET_EVENTS.ENTRY_CANCELLED, payload);

  if (queue) {
    await safelyBroadcastPositions(
      entry.queue.toString(),
      entry.business.toString(),
    );
  }

  return entry;
};
