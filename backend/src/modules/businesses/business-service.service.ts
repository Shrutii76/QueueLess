import mongoose from "mongoose";

import Business from "./business.model.js";
import { AppError } from "../../utils/app-error.js";

import type {
  CreateBusinessServiceInput,
  UpdateBusinessServiceInput,
} from "./business-service.validation.js";

// Validate MongoDB IDs.
const validateIds = (businessId: string, serviceId?: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  if (serviceId && !mongoose.isValidObjectId(serviceId)) {
    throw new AppError("Invalid service ID.", 400);
  }
};

// Create service.
export const createService = async (
  businessId: string,
  ownerId: string,
  data: CreateBusinessServiceInput,
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

  business.services.push({ ...data, _id: new mongoose.Types.ObjectId() });

  await business.save();

  const createdService = business.services[business.services.length - 1];

  return createdService;
};

// List active services.
export const listServices = async (businessId: string) => {
  validateIds(businessId);

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).select("services");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  return business.services.filter((service) => service.isActive);
};

// Get one active service.
export const getServiceById = async (businessId: string, serviceId: string) => {
  validateIds(businessId, serviceId);

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).select("services");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  const service = business.services.find(
    (item) => item._id.toString() === serviceId && item.isActive,
  );

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  return service;
};

// Update service.
export const updateService = async (
  businessId: string,
  serviceId: string,
  ownerId: string,
  data: UpdateBusinessServiceInput,
) => {
  validateIds(businessId, serviceId);

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

  const service = business.services.find(
    (item) => item._id.toString() === serviceId,
  );

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  if (data.name !== undefined) {
    service.name = data.name;
  }

  if (data.description !== undefined) {
    service.description = data.description;
  }

  if (data.duration !== undefined) {
    service.duration = data.duration;
  }

  if (data.isActive !== undefined) {
    service.isActive = data.isActive;
  }

  await business.save();

  return service;
};

// Soft-delete: deactivate service.
export const deactivateService = async (
  businessId: string,
  serviceId: string,
  ownerId: string,
) => {
  validateIds(businessId, serviceId);

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

  const service = business.services.find(
    (item) => item._id.toString() === serviceId,
  );

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  if (!service.isActive) {
    throw new AppError("Service is already inactive.", 409);
  }

  service.isActive = false;

  await business.save();

  return service;
};
