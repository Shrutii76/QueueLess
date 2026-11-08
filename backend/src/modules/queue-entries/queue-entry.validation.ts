import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

// Customer joins a queue.
export const joinQueueSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .max(300, "Notes cannot exceed 300 characters.")
      .optional(),
  })
  .strict();

export const cancelQueueEntrySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .max(300, "Cancellation reason cannot exceed 300 characters.")
      .optional(),
  })
  .strict();

// Staff updates an entry's status.
export const updateQueueEntryStatusSchema = z
  .object({
    status: z.enum(["CALLED", "SERVING", "COMPLETED", "NO_SHOW"]),
  })
  .strict();

// Validate route parameters when needed.
export const queueEntryParamsSchema = z
  .object({
    queueId: objectIdSchema,
    entryId: objectIdSchema,
  })
  .strict();

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;

export type CancelQueueEntryInput = z.infer<typeof cancelQueueEntrySchema>;

export type UpdateQueueEntryStatusInput = z.infer<
  typeof updateQueueEntryStatusSchema
>;
