import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const qrParamsSchema = z
  .object({
    businessId: objectIdSchema,
    qrId: objectIdSchema,
  })
  .strict();

export const serviceQrParamsSchema = z
  .object({
    businessId: objectIdSchema,
    serviceId: objectIdSchema,
  })
  .strict();

export const resolveQrParamsSchema = z
  .object({
    code: z.string().regex(/^[a-f0-9]{64}$/, "Invalid QR code."),
  })
  .strict();

export type QRParamsInput = z.infer<typeof qrParamsSchema>;
export type ServiceQRParamsInput = z.infer<typeof serviceQrParamsSchema>;
