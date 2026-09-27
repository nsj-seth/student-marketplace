import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getAdminDashboardController } from "./admin-dashboard.controller.js";

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAuth, requireRole("ADMIN"));
adminDashboardRouter.get("/", getAdminDashboardController);
