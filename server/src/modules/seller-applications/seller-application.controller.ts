import type { RequestHandler } from "express";
import { z } from "zod";
import {
  createSellerApplicationSchema,
  saveSellerApplicationDetailsSchema,
  updateSellerApplicationTypeSchema
} from "./seller-application.schema.js";
import {
  changeSellerApplicationType,
  getMySellerApplication,
  getMySellerApplications,
  saveSellerApplicationDetails,
  startSellerApplication,
  submitSellerApplication
} from "./seller-application.service.js";

const idSchema = z.string().uuid();

export const listMySellerApplicationsController: RequestHandler = async (req, res, next) => {
  try {
    const applications = await getMySellerApplications(req.auth!.user.id);
    res.json({ success: true, data: applications });
  } catch (error) { next(error); }
};

export const getMySellerApplicationController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ success: false, message: "Invalid seller application ID.", code: "VALIDATION_ERROR" });
    return;
  }
  try {
    const application = await getMySellerApplication(id.data, req.auth!.user.id);
    if (!application) {
      res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: application });
  } catch (error) { next(error); }
};

export const createSellerApplicationController: RequestHandler = async (req, res, next) => {
  const parsed = createSellerApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Please choose a valid business type.", code: "VALIDATION_ERROR", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const application = await startSellerApplication(req.auth!.user.id, parsed.data.businessType);
    res.status(201).json({ success: true, data: application });
  } catch (error) { next(error); }
};

export const updateSellerApplicationTypeController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  const body = updateSellerApplicationTypeSchema.safeParse(req.body);
  if (!id.success || !body.success) {
    res.status(400).json({ success: false, message: "The supplied seller application data is invalid.", code: "VALIDATION_ERROR" });
    return;
  }
  try {
    const result = await changeSellerApplicationType(id.data, req.auth!.user.id, body.data.businessType);
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" }); return;
    }
    if (result.kind === "NOT_EDITABLE") {
      res.status(409).json({ success: false, message: "Only draft seller applications can change business type.", code: "SELLER_APPLICATION_NOT_EDITABLE" }); return;
    }
    if (result.kind === "DUPLICATE_DRAFT") {
      res.status(409).json({ success: false, message: "You already have a draft application for that business type.", code: "SELLER_APPLICATION_DRAFT_EXISTS" }); return;
    }
    res.json({ success: true, data: result.application });
  } catch (error) { next(error); }
};

export const saveSellerApplicationDetailsController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  const body = saveSellerApplicationDetailsSchema.safeParse(req.body);
  if (!id.success || !body.success) {
    res.status(400).json({ success: false, message: "Please correct the business application details.", code: "VALIDATION_ERROR", errors: body.success ? undefined : body.error.flatten().fieldErrors });
    return;
  }
  try {
    const result = await saveSellerApplicationDetails(id.data, req.auth!.user.id, body.data);
    if (result.kind === "NOT_FOUND") { res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" }); return; }
    if (result.kind === "NOT_EDITABLE") { res.status(409).json({ success: false, message: "Only draft applications can be edited.", code: "SELLER_APPLICATION_NOT_EDITABLE" }); return; }
    if (result.kind === "INVALID_CATEGORY") { res.status(400).json({ success: false, message: "One or more selected categories are invalid or inactive.", code: "INVALID_CATEGORY" }); return; }
    if (result.kind === "INVALID_LOGO_PATH") { res.status(400).json({ success: false, message: "The supplied logo path is invalid.", code: "INVALID_LOGO_PATH" }); return; }
    res.json({ success: true, data: result.application });
  } catch (error) { next(error); }
};

export const submitSellerApplicationController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ success: false, message: "Invalid seller application ID.", code: "VALIDATION_ERROR" }); return;
  }
  try {
    const result = await submitSellerApplication(id.data, req.auth!.user.id);
    if (result.kind === "NOT_FOUND") { res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" }); return; }
    if (result.kind === "NOT_EDITABLE") { res.status(409).json({ success: false, message: "This application cannot be submitted in its current state.", code: "SELLER_APPLICATION_NOT_EDITABLE" }); return; }
    if (result.kind === "INCOMPLETE") { res.status(400).json({ success: false, message: "Complete all required business details, categories, fulfilment options, and logo before submitting.", code: "SELLER_APPLICATION_INCOMPLETE" }); return; }
    if (result.kind === "STUDENT_VERIFICATION_REQUIRED") { res.status(400).json({ success: false, message: "Verify your student email before submitting this Student Business application.", code: "STUDENT_VERIFICATION_REQUIRED" }); return; }
    res.json({ success: true, data: result.application });
  } catch (error) { next(error); }
};
