import type { RequestHandler } from "express";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH"]);

export const enforceRequestShape: RequestHandler = (req, res, next) => {
  if (req.originalUrl.length > 2048) {
    res.status(414).json({
      success: false,
      message: "Request URL is too long.",
      code: "URI_TOO_LONG",
      requestId: req.requestId
    });
    return;
  }

  if (MUTATING_METHODS.has(req.method)) {
    const contentLength = Number(req.header("content-length") ?? 0);
    const hasBody = contentLength > 0 || req.header("transfer-encoding") !== undefined;
    const contentType = req.header("content-type")?.toLowerCase() ?? "";

    if (hasBody && !contentType.startsWith("application/json")) {
      res.status(415).json({
        success: false,
        message: "This endpoint expects application/json.",
        code: "UNSUPPORTED_MEDIA_TYPE",
        requestId: req.requestId
      });
      return;
    }
  }

  next();
};
