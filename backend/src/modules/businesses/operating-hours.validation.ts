import { z } from "zod";

export const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be in HH:mm format, e.g. 09:00 or 18:30.",
  );

const operatingHourSchema = z
  .object({
    day: z.enum(WEEK_DAYS),

    isOpen: z.boolean(),

    openTime: timeSchema.optional(),

    closeTime: timeSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.isOpen) {
      if (!value.openTime) {
        ctx.addIssue({
          code: "custom",
          path: ["openTime"],
          message: "Opening time is required when the business is open.",
        });
      }

      if (!value.closeTime) {
        ctx.addIssue({
          code: "custom",
          path: ["closeTime"],
          message: "Closing time is required when the business is open.",
        });
      }

      if (
        value.openTime &&
        value.closeTime &&
        value.closeTime <= value.openTime
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["closeTime"],
          message: "Closing time must be later than opening time.",
        });
      }
    }
  });

export const setOperatingHoursSchema = z
  .object({
    operatingHours: z
      .array(operatingHourSchema)
      .min(1, "At least one day's schedule is required.")
      .max(7, "Maximum seven days are allowed.")
      .superRefine((hours, ctx) => {
        const days = hours.map((hour) => hour.day);

        if (new Set(days).size !== days.length) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate days are not allowed.",
          });
        }
      }),
  })
  .strict();

export const updateOperatingDaySchema = operatingHourSchema;

export type OperatingHourInput = z.infer<typeof operatingHourSchema>;

export type SetOperatingHoursInput = z.infer<typeof setOperatingHoursSchema>;
