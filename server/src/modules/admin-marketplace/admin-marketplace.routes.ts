import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getMarketplaceManagementController, setFeaturedBusinessController, setFeaturedProductController } from "./admin-marketplace.controller.js";

export const adminMarketplaceRouter = Router();
adminMarketplaceRouter.use(requireAuth, requireRole("ADMIN"));
adminMarketplaceRouter.get("/", getMarketplaceManagementController);
adminMarketplaceRouter.patch("/businesses/:id/featured", setFeaturedBusinessController);
adminMarketplaceRouter.patch("/products/:id/featured", setFeaturedProductController);
