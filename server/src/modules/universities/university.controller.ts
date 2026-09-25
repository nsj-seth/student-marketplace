import type { RequestHandler, Response } from "express";
import { z } from "zod";
import {
  createUniversitySchema,
  updateUniversitySchema
} from "./university.schema.js";
import {
  createUniversity,
  disableUniversity,
  getAdminUniversities,
  getPublicUniversities,
  updateUniversity
} from "./university.service.js";

const idSchema = z.string().uuid();

function validationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    success: false,
    message: "The supplied university data is invalid.",
    code: "VALIDATION_ERROR",
    errors: error.flatten().fieldErrors
  });
}

export const listPublicUniversities: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getPublicUniversities() });
  } catch (error) {
    next(error);
  }
};

export const listAdminUniversities: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getAdminUniversities() });
  } catch (error) {
    next(error);
  }
};

export const createUniversityController: RequestHandler = async (req, res, next) => {
  const parsed = createUniversitySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const university = await createUniversity(parsed.data);
    res.status(201).json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};

export const updateUniversityController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  const body = updateUniversitySchema.safeParse(req.body);

  if (!id.success || !body.success) {
    res.status(400).json({
      success: false,
      message: "The supplied university data is invalid.",
      code: "VALIDATION_ERROR"
    });
    return;
  }

  try {
    const university = await updateUniversity(id.data, body.data);
    if (!university) {
      res.status(404).json({ success: false, message: "University not found.", code: "UNIVERSITY_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};

export const disableUniversityController: RequestHandler = async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ success: false, message: "Invalid university ID.", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const university = await disableUniversity(id.data);
    if (!university) {
      res.status(404).json({ success: false, message: "University not found.", code: "UNIVERSITY_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};
