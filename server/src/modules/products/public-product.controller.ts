import type { RequestHandler } from "express";
import { z } from "zod";
import { publicProductListQuerySchema } from "./public-product.schema.js";
import { getPublicProduct, getPublicProducts } from "./public-product.service.js";

export const listPublicProductsController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = publicProductListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product filters.",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }
    const products = await getPublicProducts(parsed.data);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getPublicProductController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = z.string().uuid().safeParse(req.params.id);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid product id.", code: "VALIDATION_ERROR" });
      return;
    }
    const product = await getPublicProduct(parsed.data);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
