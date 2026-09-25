import { Router } from "express";
import { profileRouter } from "../modules/profiles/profile.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", profileRouter);
