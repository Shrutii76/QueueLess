import mongoose from "mongoose";

import Business from "./business.model.js";
import User from "../users/user.model.js";
import StaffMembership from "../users/staff-membership.model.js";

import { AppError } from "../../utils/app-error.js";

import type {
  InviteStaffInput,
  UpdateStaffPermissionsInput,
  UpdateStaffStatusInput,
} from "./staff.validation.js";

const validateIds = (businessId: string, staffId?: string) => {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID.", 400);
  }

  if (staffId && !mongoose.isValidObjectId(staffId)) {
    throw new AppError("Invalid staff ID.", 400);
  }
};

// 1. Invite staff.
export const inviteStaff = async (
  businessId: string,
  ownerId: string,
  data: InviteStaffInput,
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

  const identifier = data.identifier.trim();

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });

  if (!user) {
    throw new AppError(
      "No registered QueueLess user found with this email or phone.",
      404,
    );
  }

  if (user._id.toString() === ownerId) {
    throw new AppError("You cannot invite yourself as staff.", 400);
  }

  if (user.role === "BUSINESS_OWNER") {
    throw new AppError(
      "A business owner account cannot be invited as staff.",
      409,
    );
  }

  const existingMembership = await StaffMembership.findOne({
    user: user._id,
    business: business._id,
  });

  if (existingMembership) {
    if (existingMembership.status === "INVITED") {
      throw new AppError("An invitation already exists for this user.", 409);
    }

    if (existingMembership.status === "ACTIVE") {
      throw new AppError("This user is already a staff member.", 409);
    }

    existingMembership.permissions = data.permissions;
    existingMembership.status = "INVITED";
    existingMembership.invitedBy = new mongoose.Types.ObjectId(ownerId);
    existingMembership.joinedAt = undefined;

    await existingMembership.save();

    return existingMembership;
  }

  const membership = await StaffMembership.create({
    user: user._id,
    business: business._id,
    permissions: data.permissions,
    status: "INVITED",
    invitedBy: ownerId,
  });

  return membership;
};

// 2. List staff members and invitations.
export const listStaff = async (businessId: string, ownerId: string) => {
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

  return StaffMembership.find({
    business: business._id,
  })
    .populate("user", "name email phone role")
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });
};

// 3. Accept invitation.
export const acceptInvitation = async (
  membershipId: string,
  userId: string,
) => {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw new AppError("Invalid invitation ID.", 400);
  }

  const membership = await StaffMembership.findOne({
    _id: membershipId,
    user: userId,
    status: "INVITED",
  });

  if (!membership) {
    throw new AppError("Invitation not found or no longer available.", 404);
  }

  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User account is unavailable.", 403);
  }

  if (user.role === "BUSINESS_OWNER") {
    throw new AppError(
      "Business owner accounts cannot accept staff invitations.",
      409,
    );
  }

  // This project currently uses one global user role.
  // Acceptance therefore changes the account to STAFF.
  user.role = "STAFF";
  await user.save();

  membership.status = "ACTIVE";
  membership.joinedAt = new Date();

  await membership.save();

  return membership;
};

// 4. Reject invitation.
export const rejectInvitation = async (
  membershipId: string,
  userId: string,
) => {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw new AppError("Invalid invitation ID.", 400);
  }

  const membership = await StaffMembership.findOneAndDelete({
    _id: membershipId,
    user: userId,
    status: "INVITED",
  });

  if (!membership) {
    throw new AppError("Invitation not found or no longer available.", 404);
  }

  return membership;
};

// 5. Update permissions.
export const updateStaffPermissions = async (
  businessId: string,
  staffId: string,
  ownerId: string,
  data: UpdateStaffPermissionsInput,
) => {
  validateIds(businessId, staffId);

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

  const membership = await StaffMembership.findOne({
    _id: staffId,
    business: businessId,
  });

  if (!membership) {
    throw new AppError("Staff membership not found.", 404);
  }

  if (membership.status === "INVITED") {
    throw new AppError(
      "Accept the invitation before changing staff permissions.",
      409,
    );
  }

  membership.permissions = data.permissions;

  await membership.save();

  return membership;
};

// 6. Activate/deactivate staff.
export const updateStaffStatus = async (
  businessId: string,
  staffId: string,
  ownerId: string,
  data: UpdateStaffStatusInput,
) => {
  validateIds(businessId, staffId);

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

  const membership = await StaffMembership.findOne({
    _id: staffId,
    business: businessId,
  });

  if (!membership) {
    throw new AppError("Staff membership not found.", 404);
  }

  if (membership.status === "INVITED") {
    throw new AppError(
      "Pending invitations cannot be activated or deactivated using this endpoint.",
      409,
    );
  }

  membership.status = data.status;

  await membership.save();

  return membership;
};

// 7. Remove staff membership.
export const removeStaff = async (
  businessId: string,
  staffId: string,
  ownerId: string,
) => {
  validateIds(businessId, staffId);

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

  const membership = await StaffMembership.findOneAndDelete({
    _id: staffId,
    business: businessId,
  });

  if (!membership) {
    throw new AppError("Staff membership not found.", 404);
  }

  return membership;
};
