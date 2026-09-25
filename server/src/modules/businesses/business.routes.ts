import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  getMyBusinessController,
  listMyBusinessesController,
  updateMyBusinessAvailabilityController,
  updateMyBusinessController
} from "./business.controller.js";

export const sellerBusinessRouter = Router();

sellerBusinessRouter.use(requireAuth, requireRole("SELLER"));
sellerBusinessRouter.get("/", listMyBusinessesController);
sellerBusinessRouter.get("/:id", getMyBusinessController);
sellerBusinessRouter.patch("/:id", updateMyBusinessController);
sellerBusinessRouter.patch("/:id/availability", updateMyBusinessAvailabilityController);
