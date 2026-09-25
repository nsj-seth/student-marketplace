import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  attachSellerProductImageController,
  createSellerProductController,
  getSellerProductController,
  listSellerProductsController,
  removeSellerProductController,
  removeSellerProductImageController,
  reorderSellerProductImagesController,
  setSellerProductPrimaryImageController,
  updateSellerProductController,
  updateSellerProductInventoryController,
  updateSellerProductStatusController
} from "./product.controller.js";

export const sellerProductRouter = Router({ mergeParams: true });

sellerProductRouter.use(requireAuth, requireRole("SELLER"));
sellerProductRouter.get("/", listSellerProductsController);
sellerProductRouter.post("/", createSellerProductController);
sellerProductRouter.get("/:productId", getSellerProductController);
sellerProductRouter.patch("/:productId", updateSellerProductController);
sellerProductRouter.patch("/:productId/inventory", updateSellerProductInventoryController);
sellerProductRouter.patch("/:productId/status", updateSellerProductStatusController);
sellerProductRouter.post("/:productId/images", attachSellerProductImageController);
sellerProductRouter.patch("/:productId/images/order", reorderSellerProductImagesController);
sellerProductRouter.patch("/:productId/images/:imageId/primary", setSellerProductPrimaryImageController);
sellerProductRouter.delete("/:productId/images/:imageId", removeSellerProductImageController);
sellerProductRouter.delete("/:productId", removeSellerProductController);
