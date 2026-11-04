import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100),

    email: emailSchema.optional(),

    phone: phoneSchema.optional(),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(72, "Password must not exceed 72 characters"),

    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Email or phone number is required",
    path: ["email"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Email or phone number is required"),

    password: z.string().min(1, "Password is required").max(72),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
