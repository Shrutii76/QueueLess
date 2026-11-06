import { z } from "zod";

const addressSchema = z
  .object({
    street: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(15).optional(),
  })
  .strict();

const serviceSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(300).optional(),
    duration: z.number().int().min(1).max(480),
    isActive: z.boolean().default(true),
  })
  .strict();

const operatingHourSchema = z
  .object({
    day: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    isOpen: z.boolean(),
    openTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    closeTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
  })
  .strict()
  .refine(
    (value) => !value.isOpen || Boolean(value.openTime && value.closeTime),
    {
      message: "Open and close times are required when the business is open.",
    },
  );

const locationSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90), // latitude
    ]),
  })
  .strict();

export const createBusinessSchema = z
  .object({
    name: z.string().trim().min(2).max(150),

    category: z.string().trim().min(2).max(80),

    description: z.string().trim().max(1000).optional(),

    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number."),

    email: z.string().trim().email().toLowerCase().optional(),

    address: addressSchema,

    location: locationSchema.optional(),

    services: z.array(serviceSchema).max(50).default([]),

    operatingHours: z.array(operatingHourSchema).max(7).default([]),
  })
  .strict();

export const updateBusinessSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),

    category: z.string().trim().min(2).max(80).optional(),

    description: z.string().trim().max(1000).optional(),

    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/)
      .optional(),

    email: z.string().trim().email().toLowerCase().optional(),

    address: addressSchema.partial().optional(),

    location: locationSchema.optional(),

    services: z.array(serviceSchema).max(50).optional(),

    operatingHours: z.array(operatingHourSchema).max(7).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for an update.",
  );

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
