import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createOrderController, getMyOrderController, listMyOrdersController } from "./order.controller.js";

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get("/", listMyOrdersController);
orderRouter.get("/:id", getMyOrderController);
orderRouter.post("/", createOrderController);
