import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getCheckoutPreviewController, validateCheckoutController } from "./checkout.controller.js";

export const checkoutRouter = Router();
checkoutRouter.use(requireAuth);
checkoutRouter.get("/preview", getCheckoutPreviewController);
checkoutRouter.post("/validate", validateCheckoutController);
