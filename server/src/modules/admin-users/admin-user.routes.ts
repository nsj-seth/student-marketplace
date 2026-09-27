import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getAdminUserController, listAdminUsersController, updateAdminUserStatusController } from "./admin-user.controller.js";

export const adminUserRouter = Router();
adminUserRouter.use(requireAuth, requireRole("ADMIN"));
adminUserRouter.get("/", listAdminUsersController);
adminUserRouter.get("/:id", getAdminUserController);
adminUserRouter.patch("/:id/status", updateAdminUserStatusController);
