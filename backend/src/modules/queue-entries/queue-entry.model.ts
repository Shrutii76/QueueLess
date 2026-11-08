import mongoose, { Schema, Document } from "mongoose";

export const QUEUE_ENTRY_STATUSES = [
  "WAITING",
  "CALLED",
  "SERVING",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type QueueEntryStatus = (typeof QUEUE_ENTRY_STATUSES)[number];

export interface IQueueEntry extends Document {
  queue: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;

  tokenNumber: number;
  status: QueueEntryStatus;
  isActive: boolean;
  cancellationReason?: string;
  joinedAt: Date;
  calledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  noShowAt?: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const queueEntrySchema = new Schema<IQueueEntry>(
  {
    queue: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
      index: true,
    },

    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tokenNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: QUEUE_ENTRY_STATUSES,
      default: "WAITING",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    calledAt: {
      type: Date,
      default: null,
    },
    
    noShowAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A token number must be unique within its queue.
queueEntrySchema.index(
  {
    queue: 1,
    tokenNumber: 1,
  },
  {
    unique: true,
    name: "unique_queue_token",
  },
);

// Efficient customer queue history.
queueEntrySchema.index({
  customer: 1,
  joinedAt: -1,
});

// Efficient business queue lookup.
queueEntrySchema.index({
  business: 1,
  queue: 1,
  status: 1,
});

// One active entry per customer per queue.
queueEntrySchema.index(
  {
    queue: 1,
    customer: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
    name: "unique_active_customer_queue_entry",
  }
);

// Efficient waiting-list ordering.
queueEntrySchema.index({
  queue: 1,
  status: 1,
  joinedAt: 1,
});

const QueueEntry = mongoose.model<IQueueEntry>("QueueEntry", queueEntrySchema);

export default QueueEntry;
