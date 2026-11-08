import mongoose from "mongoose";

import Queue from "./queue.model.js";
import QueueEntry from "../queue-entries/queue-entry.model.js";

import {
  emitQueueEvent,
  emitCustomerEvent,
  broadcastQueuePositions,
} from "../../sockets/socket.js";

import { AppError } from "../../utils/app-error.js";
import { SOCKET_EVENTS } from "../../sockets/socket-events.js";

const ACTIVE_STATUSES = ["WAITING", "CALLED", "SERVING"] as const;

// Broadcast failures should not fail an already successful API operation.
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

// Verify request IDs.
const validateIds = (businessId: string, queueId: string, entryId?: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  if (!mongoose.isValidObjectId(queueId)) {
    throw new AppError("Invalid queue ID.", 400);
  }

  if (entryId && !mongoose.isValidObjectId(entryId)) {
    throw new AppError("Invalid queue entry ID.", 400);
  }
};

// Verify that the queue belongs to the requested business.
const findBusinessQueue = async (businessId: string, queueId: string) => {
  const queue = await Queue.findOne({
    _id: queueId,
    business: businessId,
  });

  if (!queue) {
    throw new AppError("Queue not found for this business.", 404);
  }

  return queue;
};

// Get the customer ID safely, whether or not the customer is populated.
const getCustomerId = (entry: any): string => {
  const customer = entry.customer;

  return customer?._id ? customer._id.toString() : customer.toString();
};

// 1. Get queue entries for business staff.
export const getQueueEntries = async (businessId: string, queueId: string) => {
  validateIds(businessId, queueId);

  await findBusinessQueue(businessId, queueId);

  return QueueEntry.find({
    business: businessId,
    queue: queueId,
  })
    .populate("customer", "name email phone")
    .sort({ tokenNumber: 1 });
};

// 2. Call the next waiting customer.
export const callNextCustomer = async (businessId: string, queueId: string) => {
  validateIds(businessId, queueId);

  const queue = await findBusinessQueue(businessId, queueId);

  if (queue.status !== "OPEN") {
    throw new AppError(
      "Customers can only be called when the queue is open.",
      409,
    );
  }

  // Atomically claim the next waiting entry.
  const entry = await QueueEntry.findOneAndUpdate(
    {
      business: businessId,
      queue: queueId,
      status: "WAITING",
      isActive: true,
    },
    {
      $set: {
        status: "CALLED",
        calledAt: new Date(),
      },
    },
    {
      new: true,
      sort: {
        tokenNumber: 1,
        joinedAt: 1,
      },
      runValidators: true,
    },
  ).populate("customer", "name email phone");

  if (!entry) {
    throw new AppError("There are no waiting customers in this queue.", 404);
  }

  const customerId = getCustomerId(entry);

  const payload = {
    queueId: entry.queue.toString(),
    businessId: entry.business.toString(),
    entryId: entry._id.toString(),
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    calledAt: entry.calledAt,
  };

  // Notify the business dashboard.
  emitQueueEvent(queueId, businessId, SOCKET_EVENTS.TOKEN_CALLED, payload);

  // Notify only the customer whose token was called.
  emitCustomerEvent(customerId, SOCKET_EVENTS.TOKEN_CALLED, payload);

  await safelyBroadcastPositions(queueId, businessId);

  return entry;
};

// 3. Mark a called customer as serving.
export const markCustomerServing = async (
  businessId: string,
  queueId: string,
  entryId: string,
) => {
  validateIds(businessId, queueId, entryId);

  const queue = await findBusinessQueue(businessId, queueId);

  if (queue.status === "CLOSED") {
    throw new AppError("Cannot start service for a closed queue.", 409);
  }

  const entry = await QueueEntry.findOneAndUpdate(
    {
      _id: entryId,
      business: businessId,
      queue: queueId,
      status: "CALLED",
      isActive: true,
    },
    {
      $set: {
        status: "SERVING",
        startedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("customer", "name email phone");

  if (!entry) {
    throw new AppError("Entry not found or customer has not been called.", 409);
  }

  // Record the latest token that entered service.
  await Queue.updateOne(
    { _id: queue._id },
    {
      $max: {
        currentTokenNumber: entry.tokenNumber,
      },
    },
  );

  const customerId = getCustomerId(entry);

  const payload = {
    queueId: entry.queue.toString(),
    businessId: entry.business.toString(),
    entryId: entry._id.toString(),
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    startedAt: entry.startedAt,
  };

  emitQueueEvent(queueId, businessId, SOCKET_EVENTS.CUSTOMER_SERVING, payload);

  emitCustomerEvent(customerId, SOCKET_EVENTS.CUSTOMER_SERVING, payload);

  await safelyBroadcastPositions(queueId, businessId);

  return entry;
};

// 4. Complete customer service.
export const completeCustomerService = async (
  businessId: string,
  queueId: string,
  entryId: string,
) => {
  validateIds(businessId, queueId, entryId);

  await findBusinessQueue(businessId, queueId);

  const entry = await QueueEntry.findOneAndUpdate(
    {
      _id: entryId,
      business: businessId,
      queue: queueId,
      status: "SERVING",
      isActive: true,
    },
    {
      $set: {
        status: "COMPLETED",
        completedAt: new Date(),
        isActive: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("customer", "name email phone");

  if (!entry) {
    throw new AppError(
      "Only a currently serving customer can be completed.",
      409,
    );
  }

  const customerId = getCustomerId(entry);

  const payload = {
    queueId: entry.queue.toString(),
    businessId: entry.business.toString(),
    entryId: entry._id.toString(),
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    completedAt: entry.completedAt,
  };

  emitQueueEvent(queueId, businessId, SOCKET_EVENTS.SERVICE_COMPLETED, payload);

  emitCustomerEvent(customerId, SOCKET_EVENTS.SERVICE_COMPLETED, payload);

  await safelyBroadcastPositions(queueId, businessId);

  return entry;
};

// 5. Mark a called customer as no-show.
export const markCustomerNoShow = async (
  businessId: string,
  queueId: string,
  entryId: string,
) => {
  validateIds(businessId, queueId, entryId);

  await findBusinessQueue(businessId, queueId);

  const entry = await QueueEntry.findOneAndUpdate(
    {
      _id: entryId,
      business: businessId,
      queue: queueId,
      status: "CALLED",
      isActive: true,
    },
    {
      $set: {
        status: "NO_SHOW",
        isActive: false,
        noShowAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("customer", "name email phone");

  if (!entry) {
    throw new AppError("Only a called customer can be marked as no-show.", 409);
  }

  const customerId = getCustomerId(entry);

  const payload = {
    queueId: entry.queue.toString(),
    businessId: entry.business.toString(),
    entryId: entry._id.toString(),
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    noShowAt: entry.noShowAt,
  };

  emitQueueEvent(queueId, businessId, SOCKET_EVENTS.CUSTOMER_NO_SHOW, payload);

  emitCustomerEvent(customerId, SOCKET_EVENTS.CUSTOMER_NO_SHOW, payload);

  await safelyBroadcastPositions(queueId, businessId);

  return entry;
};
