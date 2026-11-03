import type { RequestHandler, Response } from "express";
import { routeParam } from "../../utils/route-param.js";
import { createReviewSchema } from "./review.schema.js";
import { createReview, getBusinessReviews, getProductReviews, getReviewOptionsForOrder, getReviewsForSellerBusiness } from "./review.service.js";

function handleKnownError(error: unknown, res: Response) {
  if (!(error instanceof Error)) return false;
  const status: Record<string, number> = {
    PURCHASE_NOT_FOUND: 404,
    ORDER_NOT_FOUND: 404,
    REVIEW_NOT_ALLOWED: 409,
    REVIEW_ALREADY_EXISTS: 409,
    BUSINESS_NOT_FOUND: 404
  };
  const httpStatus = status[error.name];
  if (!httpStatus) return false;
  res.status(httpStatus).json({ success: false, message: error.message, code: error.name });
  return true;
}

export const createReviewController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid review.", code: "INVALID_REVIEW", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const review = await createReview(req.auth!.user.id, parsed.data);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const productReviewsController: RequestHandler = async (req, res, next) => {
  try { res.json({ success: true, data: await getProductReviews(routeParam(req.params.productId)) }); }
  catch (error) { next(error); }
};

export const businessReviewsController: RequestHandler = async (req, res, next) => {
  try { res.json({ success: true, data: await getBusinessReviews(routeParam(req.params.businessId)) }); }
  catch (error) { next(error); }
};

export const orderReviewOptionsController: RequestHandler = async (req, res, next) => {
  try { res.json({ success: true, data: await getReviewOptionsForOrder(req.auth!.user.id, routeParam(req.params.orderId)) }); }
  catch (error) { if (!handleKnownError(error, res)) next(error); }
};

export const sellerReviewsController: RequestHandler = async (req, res, next) => {
  try {
    const businessId = typeof req.query.businessId === "string" ? req.query.businessId : "";
    if (!businessId) {
      res.status(400).json({ success: false, message: "businessId is required.", code: "BUSINESS_ID_REQUIRED" });
      return;
    }
    res.json({ success: true, data: await getReviewsForSellerBusiness(req.auth!.user.id, businessId) });
  } catch (error) { if (!handleKnownError(error, res)) next(error); }
};
