import type { RequestHandler, Response } from "express";
import { checkoutValidationSchema } from "./checkout.schema.js";
import { getCheckoutPreview, validateCheckout } from "./checkout.service.js";

function handleCheckoutError(error: unknown, res: Response) {
  if (!(error instanceof Error)) return false;
  const statusByName: Record<string, number> = {
    EMPTY_CART: 409,
    BUSINESS_UNAVAILABLE: 409,
    NO_FULFILMENT_METHOD: 409,
    INSUFFICIENT_STOCK: 409,
    INVALID_FULFILMENT_SELECTION: 400
  };
  const status = statusByName[error.name];
  if (!status) return false;
  res.status(status).json({ success: false, message: error.message, code: error.name });
  return true;
}

export const getCheckoutPreviewController: RequestHandler = async (req, res, next) => {
  try {
    const data = await getCheckoutPreview(req.auth!.user.id, req.auth!.user.email ?? "");
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (!handleCheckoutError(error, res)) next(error);
  }
};

export const validateCheckoutController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = checkoutValidationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid checkout details.",
        code: "INVALID_CHECKOUT_DETAILS",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const data = await validateCheckout(req.auth!.user.id, req.auth!.user.email ?? "", parsed.data);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (!handleCheckoutError(error, res)) next(error);
  }
};
