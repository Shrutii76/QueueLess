import mongoose, { Schema, Document } from "mongoose";

export const STAFF_PERMISSIONS = [
  "VIEW_QUEUE",
  "CALL_NEXT",
  "UPDATE_ENTRY",
  "PAUSE_QUEUE",
  "MANAGE_QR",
  "VIEW_ANALYTICS",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export interface IStaffMembership extends Document {
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  permissions: StaffPermission[];
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  invitedBy: mongoose.Types.ObjectId;
  joinedAt?: Date;
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
      enum: STAFF_PERMISSIONS,
      default: ["VIEW_QUEUE"],
    },

    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "INACTIVE"],
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
  },
);

staffMembershipSchema.index({ user: 1, business: 1 }, { unique: true });

const StaffMembership = mongoose.model<IStaffMembership>(
  "StaffMembership",
  staffMembershipSchema,
);

export default StaffMembership;
