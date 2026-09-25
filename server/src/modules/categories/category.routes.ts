import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  createCategoryController,
  disableCategoryController,
  listAdminCategories,
  listPublicCategories,
  updateCategoryController
} from "./category.controller.js";

export const categoryRouter = Router();
export const adminCategoryRouter = Router();

categoryRouter.get("/", listPublicCategories);

adminCategoryRouter.use(requireAuth, requireRole("ADMIN"));
adminCategoryRouter.get("/", listAdminCategories);
adminCategoryRouter.post("/", createCategoryController);
adminCategoryRouter.patch("/:id", updateCategoryController);
adminCategoryRouter.delete("/:id", disableCategoryController);
