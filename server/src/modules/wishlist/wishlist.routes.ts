import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  addWishlistController,
  listWishlistController,
  removeWishlistController,
  wishlistStatusController
} from "./wishlist.controller.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);
wishlistRouter.get("/", listWishlistController);
wishlistRouter.post("/", addWishlistController);
wishlistRouter.get("/:productId/status", wishlistStatusController);
wishlistRouter.delete("/:productId", removeWishlistController);
