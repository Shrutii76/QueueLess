import mongoose, { Schema, Document, Types } from "mongoose";

export const STAFF_PERMISSIONS = {
  VIEW_QUEUE: "VIEW_QUEUE",
  CALL_NEXT: "CALL_NEXT",
  UPDATE_ENTRY: "UPDATE_ENTRY",
  PAUSE_QUEUE: "PAUSE_QUEUE",
  MANAGE_QR: "MANAGE_QR",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
} as const;

export type StaffPermission =
  (typeof STAFF_PERMISSIONS)[keyof typeof STAFF_PERMISSIONS];

export interface IStaffMembership extends Document {
  user: Types.ObjectId;
  business: Types.ObjectId;
  permissions: StaffPermission[];
  status: "ACTIVE" | "INACTIVE" | "INVITED";
  invitedBy: Types.ObjectId;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const staffMembershipSchema = new Schema<IStaffMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    permissions: {
      type: [String],
      enum: Object.values(STAFF_PERMISSIONS),
      default: [STAFF_PERMISSIONS.VIEW_QUEUE],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "INVITED"],
      default: "INVITED",
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A staff account can have only one membership per business.
staffMembershipSchema.index({ user: 1, business: 1 }, { unique: true });

staffMembershipSchema.index({ business: 1, status: 1 });

const StaffMembership = mongoose.model<IStaffMembership>(
  "StaffMembership",
  staffMembershipSchema,
);

export default StaffMembership;
