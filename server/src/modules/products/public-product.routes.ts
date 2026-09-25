import { Router } from "express";
import { getPublicProductController, listPublicProductsController } from "./public-product.controller.js";

export const publicProductRouter = Router();
publicProductRouter.get("/", listPublicProductsController);
publicProductRouter.get("/:id", getPublicProductController);
