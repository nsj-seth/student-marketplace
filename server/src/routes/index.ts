import { Router } from "express";
import { profileRouter } from "../modules/profiles/profile.routes.js";
import { roleRouter } from "../modules/roles/role.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", profileRouter);
apiRouter.use(roleRouter);
