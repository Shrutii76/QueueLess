import { z } from "zod";


export const updateQueueStatusSchema = z
  .object({
    status: z.enum(["OPEN", "PAUSED", "CLOSED"]),
  })
  .strict();
  
const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const queueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Queue date must use YYYY-MM-DD format.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date.");

// Create queue.
export const createQueueSchema = z
  .object({
    serviceId: objectIdSchema,

    queueDate: queueDateSchema,

    maxCapacity: z.number().int().min(1).max(1000).optional(),

    estimatedServiceMinutes: z.number().int().min(1).max(480).optional(),

    allowOnlineJoining: z.boolean().optional(),
  })
  .strict();

// Update queue settings.
export const updateQueueSchema = z
  .object({
    maxCapacity: z.number().int().min(1).max(1000).optional(),

    estimatedServiceMinutes: z.number().int().min(1).max(480).optional(),

    allowOnlineJoining: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required.",
  );

export type CreateQueueInput = z.infer<typeof createQueueSchema>;

export type UpdateQueueInput = z.infer<typeof updateQueueSchema>;
