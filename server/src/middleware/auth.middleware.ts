import type { RequestHandler } from "express";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "../lib/supabase.js";

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

    const adminClient = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Unable to verify account status: ${profileError.message}`);
    }

    if (profile?.account_status === "SUSPENDED") {
      res.status(403).json({
        success: false,
        message: "This account has been suspended.",
        code: "ACCOUNT_SUSPENDED"
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
