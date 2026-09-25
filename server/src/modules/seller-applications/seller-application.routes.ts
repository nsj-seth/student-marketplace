import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createSellerApplicationController,
  getMySellerApplicationController,
  listMySellerApplicationsController,
  saveSellerApplicationDetailsController,
  submitSellerApplicationController,
  updateSellerApplicationTypeController
} from "./seller-application.controller.js";

export const sellerApplicationRouter = Router();

sellerApplicationRouter.use(requireAuth);
sellerApplicationRouter.get("/mine", listMySellerApplicationsController);
sellerApplicationRouter.get("/:id", getMySellerApplicationController);
sellerApplicationRouter.post("/", createSellerApplicationController);
sellerApplicationRouter.patch("/:id/type", updateSellerApplicationTypeController);
sellerApplicationRouter.patch("/:id/details", saveSellerApplicationDetailsController);
sellerApplicationRouter.post("/:id/submit", submitSellerApplicationController);
