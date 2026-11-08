import mongoose from "mongoose";
import { randomBytes, createHash } from "node:crypto";
import QRCodeImage from "qrcode";

import QRCode from "./qr-code.model.js";
import Business from "../businesses/business.model.js";
import Queue from "../queues/queue.model.js";

import { AppError } from "../../utils/app-error.js";

const getQRCodeUrl = (code: string): string => {
  const baseUrl = process.env.QR_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new AppError(
      "QR_PUBLIC_BASE_URL is missing in environment variables.",
      500,
    );
  }

  return `${baseUrl.replace(/\/+$/, "")}/${code}`;
};

const hashCode = (code: string): string => {
  return createHash("sha256").update(code).digest("hex");
};

const validateIds = (businessId: string, serviceId?: string, qrId?: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  if (serviceId && !mongoose.isValidObjectId(serviceId)) {
    throw new AppError("Invalid service ID.", 400);
  }

  if (qrId && !mongoose.isValidObjectId(qrId)) {
    throw new AppError("Invalid QR code ID.", 400);
  }
};

// Verify business ownership and active service.
const getActiveBusinessService = async (
  businessId: string,
  serviceId: string,
  ownerId?: string,
) => {
  const businessFilter: Record<string, unknown> = {
    _id: businessId,
    status: "ACTIVE",
  };

  if (ownerId) {
    businessFilter.owner = ownerId;
  }

  const business = await Business.findOne(businessFilter);

  if (!business) {
    throw new AppError("Active business not found or access denied.", 404);
  }

  const service = business.services.find(
    (item) => item._id.toString() === serviceId && item.isActive,
  );

  if (!service) {
    throw new AppError("Active service not found in this business.", 404);
  }

  return { business, service };
};

// Generate a new QR code for a service.
export const generateServiceQR = async (
  businessId: string,
  serviceId: string,
  ownerId: string,
) => {
  validateIds(businessId, serviceId);

  const { business, service } = await getActiveBusinessService(
    businessId,
    serviceId,
    ownerId,
  );

  // Reuse an existing active QR instead of creating duplicates.
  const existingQR = await QRCode.findOne({
    business: business._id,
    serviceId: service._id,
    isActive: true,
  });

  if (existingQR) {
    throw new AppError(
      "An active QR code already exists for this service. Use the regenerate API to replace it.",
      409,
    );
  }

  // Generate a cryptographically secure random secret.
  const code = randomBytes(32).toString("hex");
  const codeHash = hashCode(code);

  const qrUrl = getQRCodeUrl(code);

  const qrImage = await QRCodeImage.toDataURL(qrUrl, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 400,
  });

  const qrRecord = await QRCode.create({
    business: business._id,
    serviceId: service._id,
    codeHash,
    isActive: true,
    createdBy: ownerId,
  });

  return {
    qrId: qrRecord._id,
    businessId: business._id,
    serviceId: service._id,
    businessName: business.name,
    serviceName: service.name,
    qrUrl,
    qrImage,
    isActive: qrRecord.isActive,
    createdAt: qrRecord.createdAt,
  };
};

// List QR codes belonging to a business.
export const listBusinessQRCodes = async (
  businessId: string,
  ownerId: string,
) => {
  validateIds(businessId);

  const business = await Business.findOne({
    _id: businessId,
    owner: ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not own this business.",
      404,
    );
  }

  const qrRecords = await QRCode.find({
    business: businessId,
  }).sort({ createdAt: -1 });

  return qrRecords.map((qr) => {
    const service = business.services.find(
      (item) => item._id.toString() === qr.serviceId.toString(),
    );

    return {
      qrId: qr._id,
      businessId: qr.business,
      serviceId: qr.serviceId,
      serviceName: service?.name ?? "Service unavailable",
      isActive: qr.isActive,
      createdAt: qr.createdAt,
      regeneratedAt: qr.regeneratedAt,
      deactivatedAt: qr.deactivatedAt,
    };
  });
};

// Get one QR code.
export const getBusinessQRCode = async (
  businessId: string,
  qrId: string,
  ownerId: string,
) => {
  validateIds(businessId, undefined, qrId);

  const business = await Business.findOne({
    _id: businessId,
    owner: ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not own this business.",
      404,
    );
  }

  const qr = await QRCode.findOne({
    _id: qrId,
    business: businessId,
  });

  if (!qr) {
    throw new AppError("QR code not found.", 404);
  }

  const service = business.services.find(
    (item) => item._id.toString() === qr.serviceId.toString(),
  );

  return {
    qrId: qr._id,
    businessId: qr.business,
    serviceId: qr.serviceId,
    serviceName: service?.name ?? "Service unavailable",
    isActive: qr.isActive,
    createdAt: qr.createdAt,
    regeneratedAt: qr.regeneratedAt,
    deactivatedAt: qr.deactivatedAt,
  };
};

// Deactivate a QR code.
export const deactivateQRCode = async (
  businessId: string,
  qrId: string,
  ownerId: string,
) => {
  validateIds(businessId, undefined, qrId);

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

  const qr = await QRCode.findOneAndUpdate(
    {
      _id: qrId,
      business: businessId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!qr) {
    throw new AppError("Active QR code not found.", 404);
  }

  return {
    qrId: qr._id,
    isActive: qr.isActive,
    deactivatedAt: qr.deactivatedAt,
  };
};

// Regenerate an existing service QR code.
export const regenerateServiceQR = async (
  businessId: string,
  serviceId: string,
  ownerId: string,
) => {
  validateIds(businessId, serviceId);

  const { business, service } = await getActiveBusinessService(
    businessId,
    serviceId,
    ownerId,
  );

  const existingQR = await QRCode.findOne({
    business: business._id,
    serviceId: service._id,
  }).select("+codeHash");

  if (!existingQR) {
    throw new AppError("QR code not found. Generate a QR code first.", 404);
  }

  const code = randomBytes(32).toString("hex");
  const codeHash = hashCode(code);

  const qrUrl = getQRCodeUrl(code);

  const qrImage = await QRCodeImage.toDataURL(qrUrl, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 400,
  });

  existingQR.codeHash = codeHash;
  existingQR.isActive = true;
  existingQR.regeneratedAt = new Date();
  existingQR.deactivatedAt = undefined;

  await existingQR.save();

  return {
    qrId: existingQR._id,
    businessId: business._id,
    serviceId: service._id,
    businessName: business.name,
    serviceName: service.name,
    qrUrl,
    qrImage,
    isActive: existingQR.isActive,
    regeneratedAt: existingQR.regeneratedAt,
  };
};

// Public endpoint: resolve scanned QR code.
export const resolveQRCode = async (code: string) => {
  if (!/^[a-f0-9]{64}$/.test(code)) {
    throw new AppError("Invalid QR code.", 400);
  }

  const codeHash = hashCode(code);

  const qr = await QRCode.findOne({
    codeHash,
    isActive: true,
  });

  if (!qr) {
    throw new AppError("QR code is invalid or has been deactivated.", 404);
  }

  const business = await Business.findOne({
    _id: qr.business,
    status: "ACTIVE",
  });

  if (!business) {
    throw new AppError("Business is currently unavailable.", 404);
  }

  const service = business.services.find(
    (item) => item._id.toString() === qr.serviceId.toString() && item.isActive,
  );

  if (!service) {
    throw new AppError("This service is currently unavailable.", 404);
  }

  // Find the earliest open queue accepting online customers.
  const queue = await Queue.findOne({
    business: business._id,
    serviceId: service._id,
    status: "OPEN",
    allowOnlineJoining: true,
    $expr: {
      $lt: ["$lastTokenNumber", "$maxCapacity"],
    },
  }).sort({ queueDate: 1 });

  return {
    business: {
      id: business._id,
      name: business.name,
      category: business.category,
      address: business.address,
    },
    service: {
      id: service._id,
      name: service.name,
      description: service.description,
      duration: service.duration,
    },
    queue: queue
      ? {
          id: queue._id,
          queueDate: queue.queueDate,
          status: queue.status,
          estimatedServiceMinutes: queue.estimatedServiceMinutes,
          lastTokenNumber: queue.lastTokenNumber,
          maxCapacity: queue.maxCapacity,
          available: true,
        }
      : {
          id: null,
          available: false,
          message: "No online queue is currently available for this service.",
        },
  };
};
