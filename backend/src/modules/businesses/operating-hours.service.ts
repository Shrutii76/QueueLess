import mongoose from "mongoose";

import Business from "./business.model.js";
import { AppError } from "../../utils/app-error.js";

import type {
  OperatingHourInput,
  SetOperatingHoursInput,
} from "./operating-hours.validation.js";

const validateBusinessId = (businessId: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }
};

// GET: Retrieve operating hours.
export const getOperatingHours = async (businessId: string) => {
  validateBusinessId(businessId);

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).select("operatingHours name");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  return business.operatingHours;
};

// PUT: Replace the configured weekly schedule.
export const setOperatingHours = async (
  businessId: string,
  ownerId: string,
  data: SetOperatingHoursInput,
) => {
  validateBusinessId(businessId);

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

  // Replace the complete schedule.
  business.set("operatingHours", data.operatingHours);

  await business.save();

  return business.operatingHours;
};

// PATCH: Update or add an individual day's schedule.
export const updateOperatingDay = async (
  businessId: string,
  ownerId: string,
  data: OperatingHourInput,
) => {
  validateBusinessId(businessId);

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

  const existingHours = business.operatingHours.map((hour) => ({
    day: hour.day,
    isOpen: hour.isOpen,
    openTime: hour.openTime,
    closeTime: hour.closeTime,
  }));

  const existingIndex = existingHours.findIndex(
    (hour) => hour.day === data.day,
  );

  if (existingIndex !== -1) {
    existingHours[existingIndex] = {
      day: data.day,
      isOpen: data.isOpen,
      openTime: data.openTime,
      closeTime: data.closeTime,
    };
  } else {
    existingHours.push({
      day: data.day,
      isOpen: data.isOpen,
      openTime: data.openTime,
      closeTime: data.closeTime,
    });
  }

  business.set("operatingHours", existingHours);

  await business.save();

  return business.operatingHours;
};
