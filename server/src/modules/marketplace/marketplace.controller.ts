import type { RequestHandler } from "express";
import { getMarketplaceHome } from "./marketplace.service.js";

export const getMarketplaceHomeController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getMarketplaceHome() });
  } catch (error) {
    next(error);
  }
};
