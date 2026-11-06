import mongoose, { Schema, Document } from "mongoose";

export const QUEUE_STATUSES = ["OPEN", "PAUSED", "CLOSED"] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface IQueue extends Document {
  business: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  queueDate: string;

  status: QueueStatus;

  lastTokenNumber: number;
  currentTokenNumber: number;

  maxCapacity: number;
  estimatedServiceMinutes: number;

  allowOnlineJoining: boolean;

  createdBy: mongoose.Types.ObjectId;

  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const queueSchema = new Schema<IQueue>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    // References the _id of an embedded Business.services[] item.
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // Business-local calendar date in YYYY-MM-DD format.
    queueDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    status: {
      type: String,
      enum: QUEUE_STATUSES,
      default: "OPEN",
      required: true,
    },

    lastTokenNumber: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentTokenNumber: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxCapacity: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },

    estimatedServiceMinutes: {
      type: Number,
      default: 15,
      min: 1,
      max: 480,
    },

    allowOnlineJoining: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One queue per business, service and calendar date.
queueSchema.index(
  {
    business: 1,
    serviceId: 1,
    queueDate: 1,
  },
  {
    unique: true,
    name: "unique_business_service_daily_queue",
  },
);

// Useful for retrieving queues belonging to a business.
queueSchema.index({
  business: 1,
  status: 1,
  queueDate: 1,
});

// Ensure the serving token never exceeds the last generated token.
queueSchema.pre("validate", function () {
  if (this.currentTokenNumber > this.lastTokenNumber) {
    this.invalidate(
      "currentTokenNumber",
      "Current token cannot exceed the last generated token.",
    );
  }
});

const Queue = mongoose.model<IQueue>("Queue", queueSchema);

export default Queue;
