import type { RequestHandler, Response } from "express";
import { z } from "zod";
import { createCategorySchema, updateCategorySchema } from "./category.schema.js";
import {
  createCategory,
  disableCategory,
  getAdminCategories,
  getPublicCategories,
  updateCategory
} from "./category.service.js";

const idSchema = z.string().uuid();

function validationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    success: false,
    message: "The supplied category data is invalid.",
    code: "VALIDATION_ERROR",
    errors: error.flatten().fieldErrors
  });
}

export const listPublicCategories: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getPublicCategories() });
  } catch (error) {
    next(error);
  }
};

export const listAdminCategories: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getAdminCategories() });
  } catch (error) {
    next(error);
  }
};

export const createCategoryController: RequestHandler = async (req, res, next) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    validationError(res, parsed.error);
    return;
  }

  try {
    res.status(201).json({ success: true, data: await createCategory(parsed.data) });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  const body = updateCategorySchema.safeParse(req.body);

  if (!id.success || !body.success) {
    res.status(400).json({ success: false, message: "The supplied category data is invalid.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const category = await updateCategory(id.data, body.data);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found.", code: "CATEGORY_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const disableCategoryController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ success: false, message: "Invalid category ID.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const category = await disableCategory(id.data);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found.", code: "CATEGORY_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
