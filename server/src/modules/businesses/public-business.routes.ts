import { Router } from "express";
import { getPublicBusinessController, listPublicBusinessesController } from "./public-business.controller.js";

export const publicBusinessRouter = Router();

publicBusinessRouter.get("/", listPublicBusinessesController);
publicBusinessRouter.get("/:slug", getPublicBusinessController);
