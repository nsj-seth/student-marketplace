import type { RequestHandler } from "express";
import { z } from "zod";
import { adminApplicationStatusSchema, reviewSellerApplicationSchema } from "./admin-seller-application.schema.js";
import {
  getSellerApplicationForAdmin,
  getSellerApplicationsForAdmin,
  reviewSellerApplication
} from "./admin-seller-application.service.js";

const idSchema = z.string().uuid();

export const listAdminSellerApplicationsController: RequestHandler = async (req, res, next) => {
  const status = req.query.status ? adminApplicationStatusSchema.safeParse(req.query.status) : null;
  if (status && !status.success) {
    res.status(400).json({ success: false, message: "Invalid seller application status.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const applications = await getSellerApplicationsForAdmin(status?.data);
    res.json({ success: true, data: applications });
  } catch (error) { next(error); }
};

export const getAdminSellerApplicationController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ success: false, message: "Invalid seller application ID.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const application = await getSellerApplicationForAdmin(id.data);
    if (!application) {
      res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: application });
  } catch (error) { next(error); }
};

export const reviewSellerApplicationController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  const body = reviewSellerApplicationSchema.safeParse(req.body);
  if (!id.success || !body.success) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid review decision and rejection reason where required.",
      code: "VALIDATION_ERROR",
      errors: body.success ? undefined : body.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const outcome = await reviewSellerApplication({
      applicationId: id.data,
      adminId: req.auth!.user.id,
      decision: body.data.decision,
      note: body.data.note
    });

    if (outcome.kind === "NOT_FOUND") { res.status(404).json({ success: false, message: "Seller application not found.", code: "SELLER_APPLICATION_NOT_FOUND" }); return; }
    if (outcome.kind === "NOT_PENDING") { res.status(409).json({ success: false, message: "Only pending seller applications can be reviewed.", code: "SELLER_APPLICATION_NOT_PENDING" }); return; }
    if (outcome.kind === "INCOMPLETE") { res.status(409).json({ success: false, message: "The seller application is incomplete and cannot be approved.", code: "SELLER_APPLICATION_INCOMPLETE" }); return; }
    if (outcome.kind === "STUDENT_VERIFICATION_REQUIRED") { res.status(409).json({ success: false, message: "This Student Business does not have a valid verified student email.", code: "STUDENT_VERIFICATION_REQUIRED" }); return; }
    if (outcome.kind === "FORBIDDEN") { res.status(403).json({ success: false, message: "Admin privileges are required.", code: "FORBIDDEN" }); return; }

    res.json({ success: true, data: outcome.application });
  } catch (error) { next(error); }
};
