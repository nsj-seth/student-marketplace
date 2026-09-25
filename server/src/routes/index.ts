import { Router } from "express";
import { adminCategoryRouter, categoryRouter } from "../modules/categories/category.routes.js";
import { profileRouter } from "../modules/profiles/profile.routes.js";
import { roleRouter } from "../modules/roles/role.routes.js";
import { adminUniversityRouter, universityRouter } from "../modules/universities/university.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", profileRouter);
apiRouter.use("/universities", universityRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/admin/universities", adminUniversityRouter);
apiRouter.use("/admin/categories", adminCategoryRouter);
apiRouter.use(roleRouter);
