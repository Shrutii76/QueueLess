import mongoose, { Schema, type Document } from "mongoose";

export interface IQRCode extends Document {
  business: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  codeHash: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  regeneratedAt?: Date;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const qrCodeSchema = new Schema<IQRCode>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    // References an embedded service in Business.services.
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // SHA-256 hash of the random QR secret.
    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    regeneratedAt: {
      type: Date,
    },

    deactivatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Only one QR record per business service.
qrCodeSchema.index({ business: 1, serviceId: 1 }, { unique: true });

// Efficient lookup of active QR records.
qrCodeSchema.index({ isActive: 1, business: 1 });

const QRCode =
  mongoose.models.QRCode || mongoose.model<IQRCode>("QRCode", qrCodeSchema);

export default QRCode;
