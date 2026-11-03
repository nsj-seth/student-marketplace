import type { RequestHandler } from "express";
import { routeParam } from "../../utils/route-param.js";
import { listAdminUsersQuerySchema, updateAdminUserStatusSchema } from "./admin-user.schema.js";
import { getAdminUser, getAdminUsers, updateAdminUserStatus } from "./admin-user.service.js";

export const listAdminUsersController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listAdminUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid user filters.", code: "VALIDATION_ERROR" });
      return;
    }
    res.json({ success: true, data: await getAdminUsers(parsed.data) });
  } catch (error) { next(error); }
};

export const getAdminUserController: RequestHandler = async (req, res, next) => {
  try {
    const user = await getAdminUser(routeParam(req.params.id));
    if (!user) {
      res.status(404).json({ success: false, message: "User not found.", code: "USER_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const updateAdminUserStatusController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateAdminUserStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid account status update.", code: "VALIDATION_ERROR" });
      return;
    }

    const user = await updateAdminUserStatus(req.auth!.user.id, routeParam(req.params.id), parsed.data.status, parsed.data.reason);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found.", code: "USER_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof Error && error.message === "CANNOT_SUSPEND_SELF") {
      res.status(409).json({ success: false, message: "You cannot suspend your own admin account.", code: "CANNOT_SUSPEND_SELF" });
      return;
    }
    if (error instanceof Error && error.message === "CANNOT_SUSPEND_ADMIN") {
      res.status(409).json({ success: false, message: "Admin accounts cannot be suspended from user management.", code: "CANNOT_SUSPEND_ADMIN" });
      return;
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      res.status(404).json({ success: false, message: "User not found.", code: "USER_NOT_FOUND" });
      return;
    }
    next(error);
  }
};
