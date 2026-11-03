import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import {
  attachProductImageSchema,
  createProductSchema,
  reorderProductImagesSchema,
  updateInventorySchema,
  updateProductSchema,
  updateProductStatusSchema
} from "./product.schema.js";
import {
  attachMyProductImage,
  createMyProduct,
  getMyBusinessProduct,
  getMyBusinessProducts,
  removeMyProduct,
  removeMyProductImage,
  reorderMyProductImages,
  setMyPrimaryProductImage,
  updateMyProduct,
  updateMyProductInventory,
  updateMyProductStatus
} from "./product.service.js";

function validationError(res: Parameters<RequestHandler>[1], errors: Record<string, string[] | undefined>) {
  res.status(400).json({ success: false, message: "Invalid product data.", code: "VALIDATION_ERROR", errors });
}

export const listSellerProductsController: RequestHandler = async (req, res, next) => {
  try {
    const data = await getMyBusinessProducts(routeParam(req.params.businessId), req.auth!.user.id);
    if (data === null) {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getSellerProductController: RequestHandler = async (req, res, next) => {
  try {
    const product = await getMyBusinessProduct(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const createSellerProductController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await createMyProduct(req.auth!.user.id, { businessId: routeParam(req.params.businessId), ...parsed.data });
    if (result.kind === "BUSINESS_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Business not found.", code: "BUSINESS_NOT_FOUND" });
      return;
    }
    if (result.kind === "INVALID_CATEGORY") {
      res.status(400).json({ success: false, message: "Choose an active category assigned to this business.", code: "INVALID_PRODUCT_CATEGORY" });
      return;
    }
    res.status(201).json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const updateSellerProductController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await updateMyProduct(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, parsed.data);
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "INVALID_CATEGORY") {
      res.status(400).json({ success: false, message: "Choose an active category assigned to this business.", code: "INVALID_PRODUCT_CATEGORY" });
      return;
    }
    res.json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const updateSellerProductInventoryController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateInventorySchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const product = await updateMyProductInventory(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, parsed.data.quantity);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const updateSellerProductStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateProductStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await updateMyProductStatus(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, parsed.data.status);
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "MODERATION_LOCKED") {
      res.status(409).json({ success: false, message: "This product is hidden by marketplace moderation and cannot be reactivated by the seller.", code: "PRODUCT_MODERATION_LOCKED" });
      return;
    }
    res.json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const removeSellerProductController: RequestHandler = async (req, res, next) => {
  try {
    const removed = await removeMyProduct(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id);
    if (!removed) {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    res.status(200).json({ success: true, data: { removed: true } });
  } catch (error) { next(error); }
};

export const attachSellerProductImageController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = attachProductImageSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await attachMyProductImage(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, parsed.data);
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "INVALID_PATH") {
      res.status(400).json({ success: false, message: "The uploaded image path is not valid for this product.", code: "INVALID_PRODUCT_IMAGE_PATH" });
      return;
    }
    if (result.kind === "LIMIT_REACHED") {
      res.status(409).json({ success: false, message: "A product can have at most 8 images.", code: "PRODUCT_IMAGE_LIMIT_REACHED" });
      return;
    }
    res.status(201).json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const reorderSellerProductImagesController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = reorderProductImagesSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await reorderMyProductImages(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, parsed.data.imageIds);
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "IMAGE_SET_MISMATCH") {
      res.status(400).json({ success: false, message: "The image order must contain every current product image exactly once.", code: "PRODUCT_IMAGE_SET_MISMATCH" });
      return;
    }
    res.json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const setSellerProductPrimaryImageController: RequestHandler = async (req, res, next) => {
  try {
    const result = await setMyPrimaryProductImage(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, routeParam(req.params.imageId));
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "IMAGE_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product image not found.", code: "PRODUCT_IMAGE_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: result.product });
  } catch (error) { next(error); }
};

export const removeSellerProductImageController: RequestHandler = async (req, res, next) => {
  try {
    const result = await removeMyProductImage(routeParam(req.params.productId), routeParam(req.params.businessId), req.auth!.user.id, routeParam(req.params.imageId));
    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
      return;
    }
    if (result.kind === "IMAGE_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Product image not found.", code: "PRODUCT_IMAGE_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: result.product });
  } catch (error) { next(error); }
};
