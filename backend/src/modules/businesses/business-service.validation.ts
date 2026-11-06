import { z } from "zod";

export const createBusinessServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(100),

    description: z.string().trim().max(300).optional(),

    duration: z.number().int().min(1).max(480),

    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateBusinessServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),

    description: z.string().trim().max(300).optional(),

    duration: z.number().int().min(1).max(480).optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateBusinessServiceInput = z.infer<
  typeof createBusinessServiceSchema
>;

export type UpdateBusinessServiceInput = z.infer<
  typeof updateBusinessServiceSchema
>;
