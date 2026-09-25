import type { RequestHandler } from "express";
import { z } from "zod";
import {
  confirmStudentVerificationSchema,
  requestStudentVerificationSchema
} from "./student-verification.schema.js";
import {
  confirmStudentVerification,
  getStudentVerification,
  requestStudentVerification
} from "./student-verification.service.js";

const idSchema = z.string().uuid();

export const getStudentVerificationController: RequestHandler = async (
  req,
  res,
  next
) => {
  const id = idSchema.safeParse(req.params.sellerApplicationId);
  if (!id.success) {
    res.status(400).json({
      success: false,
      message: "Invalid seller application ID.",
      code: "VALIDATION_ERROR"
    });
    return;
  }

  try {
    const verification = await getStudentVerification(id.data, req.auth!.user.id);
    res.json({ success: true, data: verification });
  } catch (error) {
    next(error);
  }
};

export const requestStudentVerificationController: RequestHandler = async (
  req,
  res,
  next
) => {
  const parsed = requestStudentVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid university and student email.",
      code: "VALIDATION_ERROR",
      errors: parsed.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const result = await requestStudentVerification({
      applicantId: req.auth!.user.id,
      ...parsed.data
    });

    if (result.kind === "APPLICATION_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" });
      return;
    }
    if (result.kind === "APPLICATION_NOT_EDITABLE") {
      res.status(409).json({ success: false, message: "Only draft applications can be verified.", code: "SELLER_APPLICATION_NOT_EDITABLE" });
      return;
    }
    if (result.kind === "NOT_STUDENT_BUSINESS") {
      res.status(409).json({ success: false, message: "Student verification only applies to Student Business applications.", code: "STUDENT_VERIFICATION_NOT_APPLICABLE" });
      return;
    }
    if (result.kind === "UNIVERSITY_NOT_FOUND") {
      res.status(400).json({ success: false, message: "Please select an active university.", code: "UNIVERSITY_NOT_FOUND" });
      return;
    }
    if (result.kind === "ALREADY_VERIFIED") {
      res.json({ success: true, data: { verification: result.verification, delivery: "ALREADY_VERIFIED" } });
      return;
    }
    if (result.kind === "TOO_SOON") {
      res.status(429).json({ success: false, message: `Please wait ${result.retryAfterSeconds} seconds before requesting another code.`, code: "VERIFICATION_RATE_LIMITED" });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        verification: result.verification,
        delivery: result.delivery,
        ...(result.developmentCode ? { developmentCode: result.developmentCode } : {})
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmStudentVerificationController: RequestHandler = async (
  req,
  res,
  next
) => {
  const parsed = confirmStudentVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Enter the 6-digit verification code.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const result = await confirmStudentVerification({
      applicantId: req.auth!.user.id,
      ...parsed.data
    });

    const errors: Record<string, [number, string, string]> = {
      APPLICATION_NOT_FOUND: [404, "Seller application not found.", "SELLER_APPLICATION_NOT_FOUND"],
      NOT_STUDENT_BUSINESS: [409, "Student verification does not apply to this application.", "STUDENT_VERIFICATION_NOT_APPLICABLE"],
      VERIFICATION_NOT_FOUND: [404, "Request a verification code first.", "STUDENT_VERIFICATION_NOT_FOUND"],
      NO_ACTIVE_CODE: [409, "Request a new verification code first.", "VERIFICATION_CODE_NOT_ACTIVE"],
      CODE_EXPIRED: [409, "That verification code has expired. Request a new one.", "VERIFICATION_CODE_EXPIRED"],
      TOO_MANY_ATTEMPTS: [429, "Too many incorrect attempts. Request a new verification code.", "VERIFICATION_TOO_MANY_ATTEMPTS"]
    };

    if (result.kind in errors) {
      const [status, message, code] = errors[result.kind]!;
      res.status(status).json({ success: false, message, code });
      return;
    }

    if (result.kind === "INVALID_CODE") {
      res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${result.attemptsRemaining} attempt(s) remaining.`,
        code: "VERIFICATION_CODE_INVALID"
      });
      return;
    }

    res.json({ success: true, data: result.verification });
  } catch (error) {
    next(error);
  }
};
