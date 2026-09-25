import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  adminAccessCheck,
  customerAccessCheck,
  getMyRoles,
  sellerAccessCheck
} from "./role.controller.js";

export const roleRouter = Router();

roleRouter.get("/me/roles", requireAuth, getMyRoles);
roleRouter.get(
  "/access/customer",
  requireAuth,
  requireRole("CUSTOMER"),
  customerAccessCheck
);
roleRouter.get(
  "/access/seller",
  requireAuth,
  requireRole("SELLER"),
  sellerAccessCheck
);
roleRouter.get(
  "/access/admin",
  requireAuth,
  requireRole("ADMIN"),
  adminAccessCheck
);
