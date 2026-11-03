import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import { publicBusinessListQuerySchema } from "./public-business.schema.js";
import { getPublicBusiness, getPublicBusinesses } from "./public-business.service.js";

export const listPublicBusinessesController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = publicBusinessListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid business filters.",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const businesses = await getPublicBusinesses(parsed.data);
    res.json({ success: true, data: businesses });
  } catch (error) {
    next(error);
  }
};

export const getPublicBusinessController: RequestHandler = async (req, res, next) => {
  try {
    const slug = routeParam(req.params.slug).trim();
    if (!slug) {
      res.status(400).json({ success: false, message: "Business slug is required.", code: "VALIDATION_ERROR" });
      return;
    }

    const business = await getPublicBusiness(slug);
    if (!business) {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};
