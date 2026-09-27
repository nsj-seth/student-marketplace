import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getAdminOrderController, listAdminOrdersController } from "./admin-order.controller.js";

export const adminOrderRouter = Router();
adminOrderRouter.use(requireAuth, requireRole("ADMIN"));
adminOrderRouter.get("/", listAdminOrdersController);
adminOrderRouter.get("/:id", getAdminOrderController);
