import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getMe, patchMe } from "./profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, getMe);
profileRouter.patch("/", requireAuth, patchMe);
