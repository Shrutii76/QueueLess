import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import mongoose from "mongoose";

import { authenticateSocket } from "./socket-auth.js";
import { SOCKET_EVENTS } from "./socket-events.js";

import Business from "../modules/businesses/business.model.js";
import QueueEntry from "../modules/queue-entries/queue-entry.model.js";
import StaffMembership from "../modules/users/staff-membership.model.js";

import type { QueueEntryStatus } from "../modules/queue-entries/queue-entry.model.js";

let io: Server | null = null;

const roomNames = {
  customer: (userId: string) => `customer:${userId}`,
  business: (businessId: string) => `business:${businessId}`,
  queue: (queueId: string) => `queue:${queueId}`,
};

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.isValidObjectId(id);

const canAccessBusiness = async (
  userId: string,
  role: string,
  businessId: string,
) => {
  const business = await Business.findById(businessId).select("owner");

  if (!business) return false;

  if (business.owner.toString() === userId) {
    return true;
  }

  if (role !== "STAFF") {
    return false;
  }

  const membership = await StaffMembership.findOne({
    user: userId,
    business: businessId,
    status: "ACTIVE",
  }).select("_id");

  return Boolean(membership);
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN
        ? process.env.CLIENT_ORIGIN.split(",").map((value) => value.trim())
        : "*",
      methods: ["GET", "POST"],
    },
  });

  authenticateSocket(io);

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as {
      id: string;
      role: string;
    };

    // Every authenticated connection joins its private customer room.
    socket.join(roomNames.customer(user.id));

    // Join a queue only if this user has an active entry in it.
    socket.on(
      SOCKET_EVENTS.JOIN_QUEUE,
      async (
        payload: { queueId?: string },
        acknowledge?: (result: object) => void,
      ) => {
        try {
          const queueId = payload?.queueId;

          if (!isValidId(queueId)) {
            acknowledge?.({
              success: false,
              message: "Invalid queue ID.",
            });
            return;
          }

          const entry = await QueueEntry.findOne({
            queue: queueId,
            customer: user.id,
            isActive: true,
          }).select("_id");

          if (!entry) {
            acknowledge?.({
              success: false,
              message: "You do not have an active entry in this queue.",
            });
            return;
          }

          await socket.join(roomNames.queue(queueId));

          acknowledge?.({
            success: true,
            message: "Joined queue updates successfully.",
          });
        } catch {
          acknowledge?.({
            success: false,
            message: "Unable to join queue updates.",
          });
        }
      },
    );

    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, (payload: { queueId?: string }) => {
      if (isValidId(payload?.queueId)) {
        void socket.leave(roomNames.queue(payload.queueId));
      }
    });

    // Business owner or active staff can join their business room.
    socket.on(
      SOCKET_EVENTS.JOIN_BUSINESS,
      async (
        payload: { businessId?: string },
        acknowledge?: (result: object) => void,
      ) => {
        try {
          const businessId = payload?.businessId;

          if (!isValidId(businessId)) {
            acknowledge?.({
              success: false,
              message: "Invalid business ID.",
            });
            return;
          }

          const allowed = await canAccessBusiness(
            user.id,
            user.role,
            businessId,
          );

          if (!allowed) {
            acknowledge?.({
              success: false,
              message: "You do not have access to this business.",
            });
            return;
          }

          await socket.join(roomNames.business(businessId));

          acknowledge?.({
            success: true,
            message: "Joined business updates successfully.",
          });
        } catch {
          acknowledge?.({
            success: false,
            message: "Unable to join business updates.",
          });
        }
      },
    );

    socket.on(
      SOCKET_EVENTS.LEAVE_BUSINESS,
      (payload: { businessId?: string }) => {
        if (isValidId(payload?.businessId)) {
          void socket.leave(roomNames.business(payload.businessId));
        }
      },
    );
  });

  return io;
};

// Safely access the initialized Socket.IO instance.
export const getIO = (): Server | null => io;

// Broadcast an event to queue customers and business dashboard.
export const emitQueueEvent = (
  queueId: string,
  businessId: string,
  event: string,
  payload: object,
) => {
  if (!io) return;

  io.to(roomNames.queue(queueId)).emit(event, payload);
  io.to(roomNames.business(businessId)).emit(event, payload);
};

// Send a private event to one customer.
export const emitCustomerEvent = (
  customerId: string,
  event: string,
  payload: object,
) => {
  if (!io) return;

  io.to(roomNames.customer(customerId)).emit(event, payload);
};

// Broadcast fresh positions to active customers and the business room.
export const broadcastQueuePositions = async (
  queueId: string,
  businessId: string,
) => {
  if (!io) return;

  const activeStatuses: QueueEntryStatus[] = ["WAITING", "CALLED", "SERVING"];

  const entries = await QueueEntry.find({
    queue: queueId,
    business: businessId,
    isActive: true,
    status: { $in: activeStatuses },
  })
    .select("_id customer tokenNumber status")
    .sort({ tokenNumber: 1 });

  const positions = entries.map((entry, index) => ({
    entryId: entry._id.toString(),
    customerId: entry.customer.toString(),
    tokenNumber: entry.tokenNumber,
    status: entry.status,
    position: entry.status === "SERVING" ? 0 : index + 1,
    peopleAhead: entry.status === "SERVING" ? 0 : index,
  }));

  // Business dashboard receives the current active queue snapshot.
  io.to(roomNames.business(businessId)).emit(SOCKET_EVENTS.SNAPSHOT_UPDATED, {
    queueId,
    positions: positions.map(({ customerId, ...item }) => item),
    updatedAt: new Date(),
  });

  // Each customer receives only their own position.
  for (const position of positions) {
    io.to(roomNames.customer(position.customerId)).emit(
      SOCKET_EVENTS.POSITION_UPDATED,
      {
        queueId,
        entryId: position.entryId,
        tokenNumber: position.tokenNumber,
        status: position.status,
        position: position.position,
        peopleAhead: position.peopleAhead,
        updatedAt: new Date(),
      },
    );
  }
};
