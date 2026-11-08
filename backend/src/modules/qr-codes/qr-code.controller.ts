import type { Request, Response, NextFunction } from "express";

import * as qrCodeService from "./qr-code.service.js";

const getParam = (req: Request, name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// 1. Generate QR.
export const generateQR = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.generateServiceQR(
      getParam(req, "businessId"),
      getParam(req, "serviceId"),
      req.user!.id,
    );

    res.status(201).json({
      success: true,
      message: "QR code generated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 2. List business QR codes.
export const listQRCodes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.listBusinessQRCodes(
      getParam(req, "businessId"),
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get QR details.
export const getQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.getBusinessQRCode(
      getParam(req, "businessId"),
      getParam(req, "qrId"),
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Deactivate QR.
export const deactivateQR = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.deactivateQRCode(
      getParam(req, "businessId"),
      getParam(req, "qrId"),
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      message: "QR code deactivated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Regenerate QR.
export const regenerateQR = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.regenerateServiceQR(
      getParam(req, "businessId"),
      getParam(req, "serviceId"),
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      message: "QR code regenerated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Public QR resolution.
export const resolveQR = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await qrCodeService.resolveQRCode(getParam(req, "code"));

    res.status(200).json({
      success: true,
      message: "QR code resolved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
