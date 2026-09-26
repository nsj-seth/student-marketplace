import type { RequestHandler } from "express";
import { addWishlistItemSchema, wishlistProductParamSchema } from "./wishlist.schema.js";
import { addToWishlist, getWishlist, getWishlistStatus, removeFromWishlist } from "./wishlist.service.js";

export const listWishlistController: RequestHandler = async (req, res, next) => {
  try {
    const items = await getWishlist(req.auth!.user.id);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const wishlistStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = wishlistProductParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid product ID.", code: "INVALID_PRODUCT_ID" });
      return;
    }

    const data = await getWishlistStatus(req.auth!.user.id, parsed.data.productId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const addWishlistController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = addWishlistItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid wishlist request.",
        code: "INVALID_WISHLIST_REQUEST",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const data = await addToWishlist(req.auth!.user.id, parsed.data.productId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.name === "PRODUCT_NOT_AVAILABLE") {
      res.status(404).json({ success: false, message: error.message, code: "PRODUCT_NOT_AVAILABLE" });
      return;
    }
    next(error);
  }
};

export const removeWishlistController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = wishlistProductParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid product ID.", code: "INVALID_PRODUCT_ID" });
      return;
    }

    await removeFromWishlist(req.auth!.user.id, parsed.data.productId);
    res.status(200).json({ success: true, data: { removed: true } });
  } catch (error) {
    next(error);
  }
};
