import { z } from "zod";

export const staffPermissions = [
  "VIEW_QUEUE",
  "CALL_NEXT",
  "UPDATE_ENTRY",
  "PAUSE_QUEUE",
  "MANAGE_QR",
  "VIEW_ANALYTICS",
] as const;

export const inviteStaffSchema = z
  .object({
    identifier: z.string().trim().min(1).max(150),

    permissions: z
      .array(z.enum(staffPermissions))
      .min(1)
      .default(["VIEW_QUEUE"]),
  })
  .strict();

export const updateStaffPermissionsSchema = z
  .object({
    permissions: z.array(z.enum(staffPermissions)).min(1),
  })
  .strict();

export const updateStaffStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export type UpdateStaffPermissionsInput = z.infer<
  typeof updateStaffPermissionsSchema
>;

export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
