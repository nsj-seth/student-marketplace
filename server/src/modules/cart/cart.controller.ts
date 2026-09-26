import type { RequestHandler, Response } from "express";
import { addCartItemSchema, cartItemParamSchema, updateCartItemSchema } from "./cart.schema.js";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "./cart.service.js";

function handleCartError(error: unknown, res: Response) {
  if (!(error instanceof Error)) return false;
  const statusByName: Record<string, number> = {
    PRODUCT_NOT_AVAILABLE: 404,
    CART_ITEM_NOT_FOUND: 404,
    INSUFFICIENT_STOCK: 409,
    BUSINESS_UNAVAILABLE: 409,
    INVALID_QUANTITY: 400
  };
  const status = statusByName[error.name];
  if (!status) return false;
  res.status(status).json({ success: false, message: error.message, code: error.name });
  return true;
}

export const getCartController: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await getCart(req.auth!.user.id) });
  } catch (error) { next(error); }
};

export const addCartItemController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = addCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid cart item.", code: "INVALID_CART_ITEM", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await addCartItem(req.auth!.user.id, parsed.data.productId, parsed.data.quantity);
    res.status(201).json({ success: true, data });
  } catch (error) { if (!handleCartError(error, res)) next(error); }
};

export const updateCartItemController: RequestHandler = async (req, res, next) => {
  try {
    const params = cartItemParamSchema.safeParse(req.params);
    const body = updateCartItemSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ success: false, message: "Invalid cart update.", code: "INVALID_CART_UPDATE" });
      return;
    }
    const data = await updateCartItem(req.auth!.user.id, params.data.itemId, body.data.quantity);
    res.status(200).json({ success: true, data });
  } catch (error) { if (!handleCartError(error, res)) next(error); }
};

export const removeCartItemController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = cartItemParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid cart item ID.", code: "INVALID_CART_ITEM_ID" });
      return;
    }
    const data = await removeCartItem(req.auth!.user.id, parsed.data.itemId);
    res.status(200).json({ success: true, data });
  } catch (error) { if (!handleCartError(error, res)) next(error); }
};

export const clearCartController: RequestHandler = async (req, res, next) => {
  try {
    const data = await clearCart(req.auth!.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};
