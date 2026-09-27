import type { RequestHandler } from "express";
import { listAdminProductsQuerySchema, updateAdminProductStatusSchema } from "./admin-product.schema.js";
import { getAdminProducts, updateAdminProductStatus } from "./admin-product.service.js";

export const listAdminProductsController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listAdminProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid product filters.", code: "VALIDATION_ERROR" }); return; }
    res.json({ success: true, data: await getAdminProducts(parsed.data) });
  } catch (error) { next(error); }
};

export const updateAdminProductStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateAdminProductStatusSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid product status update.", code: "VALIDATION_ERROR" }); return; }
    await updateAdminProductStatus(req.auth!.user.id, req.params.id, parsed.data.action, parsed.data.reason);
    res.json({ success: true, data: { id: req.params.id, action: parsed.data.action } });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") { res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" }); return; }
    if (error instanceof Error && error.message === "PRODUCT_REMOVED") { res.status(409).json({ success: false, message: "Removed products cannot be restored through admin moderation.", code: "PRODUCT_REMOVED" }); return; }
    next(error);
  }
};
