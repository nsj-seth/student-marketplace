import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { listAdminProductsController, updateAdminProductStatusController } from "./admin-product.controller.js";
export const adminProductRouter = Router();
adminProductRouter.use(requireAuth, requireRole("ADMIN"));
adminProductRouter.get("/", listAdminProductsController);
adminProductRouter.patch("/:id/status", updateAdminProductStatusController);
