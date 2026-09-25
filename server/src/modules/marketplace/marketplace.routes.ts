import { Router } from "express";
import { getMarketplaceHomeController } from "./marketplace.controller.js";

export const marketplaceRouter = Router();
marketplaceRouter.get("/home", getMarketplaceHomeController);
