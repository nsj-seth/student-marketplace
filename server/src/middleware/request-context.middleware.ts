import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id")?.trim();
  const requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
