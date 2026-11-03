import type { RequestHandler, Response } from "express";
import { routeParam } from "../../utils/route-param.js";
import { sellerOrderListQuerySchema, sellerOrderStatusSchema } from "./seller-order.schema.js";
import { getMySellerOrder, getMySellerOrders, updateMySellerOrderStatus } from "./seller-order.service.js";

function handle(error: unknown, res: Response) {
  if (!(error instanceof Error)) return false;
  const statuses: Record<string, number> = {
    SELLER_ORDER_NOT_FOUND: 404,
    SELLER_ORDER_TERMINAL: 409,
    INVALID_ORDER_TRANSITION: 409,
    REJECTION_REASON_REQUIRED: 400
  };
  const status = statuses[error.name];
  if (!status) return false;
  res.status(status).json({ success: false, message: error.message, code: error.name });
  return true;
}

export const listSellerOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = sellerOrderListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid seller order filters.", code: "INVALID_FILTERS" });
      return;
    }
    const orders = await getMySellerOrders(req.auth!.user.id, parsed.data.businessId, parsed.data.group);
    res.json({ success: true, data: orders });
  } catch (error) { next(error); }
};

export const getSellerOrderController: RequestHandler = async (req, res, next) => {
  try {
    const order = await getMySellerOrder(req.auth!.user.id, routeParam(req.params.id));
    res.json({ success: true, data: order });
  } catch (error) { if (!handle(error, res)) next(error); }
};

export const updateSellerOrderStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = sellerOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid status update.", code: "INVALID_STATUS_UPDATE", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const order = await updateMySellerOrderStatus(req.auth!.user.id, routeParam(req.params.id), parsed.data.status, parsed.data.note);
    res.json({ success: true, data: order });
  } catch (error) { if (!handle(error, res)) next(error); }
};
