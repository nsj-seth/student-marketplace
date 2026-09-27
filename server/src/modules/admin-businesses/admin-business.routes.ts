import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { listAdminBusinessesController, updateAdminBusinessStatusController } from "./admin-business.controller.js";

export const adminBusinessRouter = Router();
adminBusinessRouter.use(requireAuth, requireRole("ADMIN"));
adminBusinessRouter.get("/", listAdminBusinessesController);
adminBusinessRouter.patch("/:id/status", updateAdminBusinessStatusController);
