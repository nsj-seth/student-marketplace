import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { createReportController, getAdminReportController, listAdminReportsController, listMyReportsController, resolveAdminReportController } from "./report.controller.js";

export const reportRouter = Router();
reportRouter.use(requireAuth);
reportRouter.get("/mine", listMyReportsController);
reportRouter.post("/", createReportController);

export const adminReportRouter = Router();
adminReportRouter.use(requireAuth, requireRole("ADMIN"));
adminReportRouter.get("/", listAdminReportsController);
adminReportRouter.get("/:id", getAdminReportController);
adminReportRouter.patch("/:id/resolve", resolveAdminReportController);
