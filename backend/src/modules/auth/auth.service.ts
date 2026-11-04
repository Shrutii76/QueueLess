import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../users/user.model.js";
import { USER_ROLES } from "../../types/roles.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
};

const createToken = (user: {
  id: string;
  role: string;
  tokenVersion: number;
}): string => {
  return jwt.sign(
    {
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: "7d",
      issuer: "queueless-api",
      audience: "queueless-mobile",
    },
  );
};

const sanitizeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email ?? null,
  phone: user.phone ?? null,
  role: user.role,
  avatar: user.avatar ?? null,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

export const registerUser = async (data: RegisterInput) => {
  const { name, email, phone, password } = data;

  const conditions = [];

  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  const existingUser = await User.findOne({
    $or: conditions,
  });

  if (existingUser) {
    throw new Error("An account with these details already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: USER_ROLES.CUSTOMER,
  });

  const tokenVersion = user.tokenVersion ?? 0;

  const token = createToken({
    id: user._id.toString(),
    role: user.role,
    tokenVersion,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

export const loginUser = async (data: LoginInput) => {
  const { identifier, password } = data;

  const normalizedIdentifier = identifier.toLowerCase();

  const isEmail = normalizedIdentifier.includes("@");

  const user = await User.findOne(
    isEmail ? { email: normalizedIdentifier } : { phone: identifier },
  ).select("+password +tokenVersion");

  if (!user) {
    throw new Error("Invalid email/phone or password");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email/phone or password");
  }

  const tokenVersion = user.tokenVersion ?? 0;

  const token = createToken({
    id: user._id.toString(),
    role: user.role,
    tokenVersion,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new Error("User account not found or inactive");
  }

  return sanitizeUser(user);
};

export const logoutUser = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true },
  );

  if (!user) {
    throw new Error("User not found");
  }

  return { message: "Logged out successfully" };
};

export const verifyAccessToken = (
  token: string,
): JwtPayload & {
  sub: string;
  role: string;
  tokenVersion: number;
} => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: "queueless-api",
    audience: "queueless-mobile",
  });

  if (
    typeof decoded === "string" ||
    !decoded.sub ||
    typeof decoded.role !== "string" ||
    typeof decoded.tokenVersion !== "number" ||
    !mongoose.isValidObjectId(decoded.sub)
  ) {
    throw new Error("Invalid access token");
  }

  return decoded as JwtPayload & {
    sub: string;
    role: string;
    tokenVersion: number;
  };
};
