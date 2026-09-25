import type { RequestHandler } from "express";
import { updateAvailabilitySchema, updateBusinessSchema } from "./business.schema.js";
import { getMyBusiness, getMyBusinesses, setMyBusinessAvailability, updateMyBusiness } from "./business.service.js";

export const listMyBusinessesController: RequestHandler = async (req, res, next) => {
  try {
    const businesses = await getMyBusinesses(req.auth!.user.id);
    res.json({ success: true, data: businesses });
  } catch (error) {
    next(error);
  }
};

export const getMyBusinessController: RequestHandler = async (req, res, next) => {
  try {
    const business = await getMyBusiness(req.params.id!, req.auth!.user.id);
    if (!business) {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

export const updateMyBusinessController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateBusinessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid business details.",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const business = await updateMyBusiness(req.params.id!, req.auth!.user.id, parsed.data);
    if (!business) {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

export const updateMyBusinessAvailabilityController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid availability status.", code: "VALIDATION_ERROR" });
      return;
    }

    const business = await setMyBusinessAvailability(req.params.id!, req.auth!.user.id, parsed.data.availabilityStatus);
    if (!business) {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};
