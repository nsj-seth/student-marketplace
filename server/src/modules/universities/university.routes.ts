import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  createUniversityController,
  disableUniversityController,
  listAdminUniversities,
  listPublicUniversities,
  updateUniversityController
} from "./university.controller.js";

export const universityRouter = Router();
export const adminUniversityRouter = Router();

universityRouter.get("/", listPublicUniversities);

adminUniversityRouter.use(requireAuth, requireRole("ADMIN"));
adminUniversityRouter.get("/", listAdminUniversities);
adminUniversityRouter.post("/", createUniversityController);
adminUniversityRouter.patch("/:id", updateUniversityController);
adminUniversityRouter.delete("/:id", disableUniversityController);
