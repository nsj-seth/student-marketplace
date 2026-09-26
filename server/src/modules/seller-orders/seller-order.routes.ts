import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getSellerOrderController, listSellerOrdersController, updateSellerOrderStatusController } from "./seller-order.controller.js";

export const sellerOrderRouter = Router();
sellerOrderRouter.use(requireAuth, requireRole("SELLER"));
sellerOrderRouter.get("/", listSellerOrdersController);
sellerOrderRouter.get("/:id", getSellerOrderController);
sellerOrderRouter.patch("/:id/status", updateSellerOrderStatusController);
