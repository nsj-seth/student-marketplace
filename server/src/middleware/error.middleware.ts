import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = req.requestId;
  console.error(`[${requestId ?? "no-request-id"}]`, error);

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      message: "Malformed JSON request body.",
      code: "INVALID_JSON",
      requestId
    });
    return;
  }

  if (error instanceof Error && error.message === "CORS_ORIGIN_NOT_ALLOWED") {
    res.status(403).json({
      success: false,
      message: "This origin is not allowed to access the API.",
      code: "CORS_ORIGIN_NOT_ALLOWED",
      requestId
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
    code: "INTERNAL_SERVER_ERROR",
    requestId,
    ...(env.NODE_ENV === "development" && {
      debug: error instanceof Error ? error.message : "Unknown error"
    })
  });
};
