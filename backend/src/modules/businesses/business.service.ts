import mongoose from "mongoose";

import Business from "./business.model.js";
import { AppError } from "../../utils/app-error.js";

import type {
  CreateBusinessInput,
  UpdateBusinessInput,
} from "./business.validation.js";

interface ListBusinessFilters {
  search?: string;
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export const createBusiness = async (
  ownerId: string,
  data: CreateBusinessInput,
) => {
  const business = await Business.create({
    ...data,
    owner: ownerId,
    status: "ACTIVE",
  });

  return business;
};

export const listBusinesses = async (filters: ListBusinessFilters) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 10));

  const query: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (filters.category) {
    query.category = {
      $regex: filters.category,
      $options: "i",
    };
  }

  if (filters.city) {
    query["address.city"] = {
      $regex: filters.city,
      $options: "i",
    };
  }

  if (filters.search) {
    const search = filters.search.trim();

    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { "address.city": { $regex: search, $options: "i" } },
    ];
  }

  const [businesses, total] = await Promise.all([
    Business.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Business.countDocuments(query),
  ]);

  return {
    businesses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
};

export const getBusinessById = async (businessId: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).select("-__v");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  return business;
};

export const getBusinessForManagement = async (businessId: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  const business = await Business.findById(businessId).select("-__v");

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  return business;
};

export const updateBusiness = async (
  businessId: string,
  ownerId: string,
  data: UpdateBusinessInput,
) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  // Prepare update fields
  const updateFields: Record<string, unknown> = { ...data };

  // Update individual address fields without replacing
  // the entire existing address object.
  if (data.address) {
    delete updateFields.address;

    for (const [key, value] of Object.entries(data.address)) {
      updateFields[`address.${key}`] = value;
    }
  }

  // Update only the business owned by this user.
  const business = await Business.findOneAndUpdate(
    {
      _id: businessId,
      owner: ownerId,
    },
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("-__v");

  if (!business) {
    throw new AppError(
      "Business not found or you do not own this business.",
      404,
    );
  }

  return business;
};
