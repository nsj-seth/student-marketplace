import type { RequestHandler } from "express";
import { getAdminDashboard } from "./admin-dashboard.service.js";

export const getAdminDashboardController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getAdminDashboard() });
  } catch (error) {
    next(error);
  }
};
