import type { RequestHandler } from "express";
import { findRolesByUserId } from "./role.repository.js";

export const getMyRoles: RequestHandler = async (req, res, next) => {
  try {
    const roles = await findRolesByUserId(req.auth!.user.id);

    res.status(200).json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    next(error);
  }
};

export const customerAccessCheck: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Customer access granted." }
  });
};

export const sellerAccessCheck: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Seller access granted." }
  });
};

export const adminAccessCheck: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Admin access granted." }
  });
};
