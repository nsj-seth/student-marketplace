import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { addCartItemController, clearCartController, getCartController, removeCartItemController, updateCartItemController } from "./cart.controller.js";

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get("/", getCartController);
cartRouter.post("/items", addCartItemController);
cartRouter.patch("/items/:itemId", updateCartItemController);
cartRouter.delete("/items/:itemId", removeCartItemController);
cartRouter.delete("/", clearCartController);
