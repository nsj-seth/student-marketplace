import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  getAdminSellerApplicationController,
  listAdminSellerApplicationsController,
  reviewSellerApplicationController
} from "./admin-seller-application.controller.js";

export const adminSellerApplicationRouter = Router();

adminSellerApplicationRouter.use(requireAuth, requireRole("ADMIN"));
adminSellerApplicationRouter.get("/", listAdminSellerApplicationsController);
adminSellerApplicationRouter.get("/:id", getAdminSellerApplicationController);
adminSellerApplicationRouter.patch("/:id/review", reviewSellerApplicationController);
