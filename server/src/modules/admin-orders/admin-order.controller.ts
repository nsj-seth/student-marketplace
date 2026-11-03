import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import { listAdminOrdersQuerySchema } from "./admin-order.schema.js";
import { getAdminOrder, getAdminOrders } from "./admin-order.service.js";

export const listAdminOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listAdminOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid order filters.", code: "VALIDATION_ERROR" });
      return;
    }
    res.json({ success: true, data: await getAdminOrders(parsed.data) });
  } catch (error) { next(error); }
};

export const getAdminOrderController: RequestHandler = async (req, res, next) => {
  try {
    const order = await getAdminOrder(routeParam(req.params.id));
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found.", code: "ORDER_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};
