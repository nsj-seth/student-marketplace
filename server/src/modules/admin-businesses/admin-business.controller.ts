import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import { listAdminBusinessesQuerySchema, updateAdminBusinessStatusSchema } from "./admin-business.schema.js";
import { getAdminBusinesses, updateAdminBusinessStatus } from "./admin-business.service.js";

export const listAdminBusinessesController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listAdminBusinessesQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid business filters.", code: "VALIDATION_ERROR" }); return; }
    res.json({ success: true, data: await getAdminBusinesses(parsed.data) });
  } catch (error) { next(error); }
};

export const updateAdminBusinessStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateAdminBusinessStatusSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid business status update.", code: "VALIDATION_ERROR" }); return; }
    await updateAdminBusinessStatus(req.auth!.user.id, routeParam(req.params.id), parsed.data.action, parsed.data.reason);
    res.json({ success: true, data: { id: routeParam(req.params.id), action: parsed.data.action } });
  } catch (error) {
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") { res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" }); return; }
    next(error);
  }
};
