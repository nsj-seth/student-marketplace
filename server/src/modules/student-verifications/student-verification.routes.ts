import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  confirmStudentVerificationController,
  getStudentVerificationController,
  requestStudentVerificationController
} from "./student-verification.controller.js";

export const studentVerificationRouter = Router();

studentVerificationRouter.use(requireAuth);
studentVerificationRouter.get(
  "/application/:sellerApplicationId",
  getStudentVerificationController
);
studentVerificationRouter.post("/request", requestStudentVerificationController);
studentVerificationRouter.post("/confirm", confirmStudentVerificationController);
