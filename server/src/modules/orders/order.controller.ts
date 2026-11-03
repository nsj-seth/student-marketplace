import type { RequestHandler, Response } from "express";
import { routeParam } from "../../utils/route-param.js";
import { checkoutValidationSchema } from "../checkout/checkout.schema.js";
import { getMyOrder, getMyOrders, placeOrder } from "./order.service.js";

function handleOrderError(error: unknown, res: Response) {
  if (!(error instanceof Error)) return false;
  const statusByName: Record<string, number> = {
    EMPTY_CART: 409,
    BUSINESS_UNAVAILABLE: 409,
    INSUFFICIENT_STOCK: 409,
    PRODUCT_NOT_AVAILABLE: 409,
    INVALID_FULFILMENT_SELECTION: 400,
    INVALID_CHECKOUT_DETAILS: 400,
    ORDER_NOT_FOUND: 404
  };
  const status = statusByName[error.name];
  if (!status) return false;
  res.status(status).json({ success: false, message: error.message, code: error.name });
  return true;
}

export const createOrderController: RequestHandler = async (req, res, next) => {
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

    const order = await placeOrder(req.auth!.user.id, parsed.data);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (!handleOrderError(error, res)) next(error);
  }
};

export const listMyOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const orders = await getMyOrders(req.auth!.user.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderController: RequestHandler = async (req, res, next) => {
  try {
    const order = await getMyOrder(req.auth!.user.id, routeParam(req.params.id));
    res.json({ success: true, data: order });
  } catch (error) {
    if (!handleOrderError(error, res)) next(error);
  }
};
