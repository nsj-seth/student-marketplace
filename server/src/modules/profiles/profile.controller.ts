import type { RequestHandler } from "express";
import { updateProfileSchema } from "./profile.schema.js";
import { getCurrentProfile, updateCurrentProfile } from "./profile.service.js";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = req.auth!.user;
    const profile = await getCurrentProfile(user);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const patchMe: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "The profile data is invalid.",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const profile = await updateCurrentProfile(req.auth!.user, parsed.data.fullName);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
