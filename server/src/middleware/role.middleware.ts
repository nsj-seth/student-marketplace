import type { RequestHandler } from "express";
import { findRolesByUserId } from "../modules/roles/role.repository.js";
import type { AppRole } from "../modules/roles/role.types.js";

export function requireRole(...allowedRoles: AppRole[]): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.auth?.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Authentication is required.",
          code: "AUTH_REQUIRED"
        });
        return;
      }

      const roles = await findRolesByUserId(user.id);
      req.auth!.roles = roles;

      const allowed = allowedRoles.some((role) => roles.includes(role));

      if (!allowed) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
          code: "FORBIDDEN"
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
