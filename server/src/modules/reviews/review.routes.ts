import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { businessReviewsController, createReviewController, orderReviewOptionsController, productReviewsController, sellerReviewsController } from "./review.controller.js";

export const reviewRouter = Router();
reviewRouter.post("/", requireAuth, createReviewController);
reviewRouter.get("/seller", requireAuth, requireRole("SELLER"), sellerReviewsController);
reviewRouter.get("/order/:orderId/options", requireAuth, orderReviewOptionsController);
reviewRouter.get("/products/:productId", productReviewsController);
reviewRouter.get("/businesses/:businessId", businessReviewsController);
