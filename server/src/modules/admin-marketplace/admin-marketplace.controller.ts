import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import { updateFeaturedSchema } from "./admin-marketplace.schema.js";
import { getMarketplaceManagementData, setFeaturedBusiness, setFeaturedProduct } from "./admin-marketplace.service.js";

export const getMarketplaceManagementController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getMarketplaceManagementData() });
  } catch (error) { next(error); }
};

export const setFeaturedBusinessController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateFeaturedSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid featured setting.", code: "VALIDATION_ERROR" });
      return;
    }
    res.json({ success: true, data: await setFeaturedBusiness(req.auth!.user.id, routeParam(req.params.id), parsed.data.featured) });
  } catch (error) {
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    if (error instanceof Error && error.message === "BUSINESS_NOT_ACTIVE") {
      res.status(409).json({ success: false, message: "Only active businesses can be featured.", code: "BUSINESS_NOT_ACTIVE" });
      return;
    }
    next(error);
  }
};

export const setFeaturedProductController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateFeaturedSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid featured setting.", code: "VALIDATION_ERROR" });
      return;
    }
    res.json({ success: true, data: await setFeaturedProduct(req.auth!.user.id, routeParam(req.params.id), parsed.data.featured) });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (error instanceof Error && error.message === "PRODUCT_NOT_PUBLIC") {
      res.status(409).json({ success: false, message: "Only public products from active businesses can be featured.", code: "PRODUCT_NOT_PUBLIC" });
      return;
    }
    next(error);
  }
};
