import type { RequestHandler } from "express";
import { getSupabaseAuthClient } from "../lib/supabase.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication is required.",
        code: "AUTH_REQUIRED"
      });
      return;
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    if (!accessToken) {
      res.status(401).json({
        success: false,
        message: "Authentication is required.",
        code: "AUTH_REQUIRED"
      });
      return;
    }

    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: "Your session is invalid or has expired.",
        code: "INVALID_SESSION"
      });
      return;
    }

    req.auth = {
      user: data.user,
      accessToken
    };

    next();
  } catch (error) {
    next(error);
  }
};
