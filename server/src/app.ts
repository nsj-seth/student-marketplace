import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { allowedOrigins, env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import { enforceRequestShape } from "./middleware/security.middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
  },
  methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept", "X-Request-Id"],
  maxAge: 600
}));
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(enforceRequestShape);

if (env.NODE_ENV === "development") {
  app.use(morgan(":method :url :status :response-time ms req=:req[x-request-id]"));
}

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later.", code: "RATE_LIMITED" }
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: (req) => !["POST", "PUT", "PATCH", "DELETE"].includes(req.method),
    message: { success: false, message: "Too many write requests. Please try again later.", code: "WRITE_RATE_LIMITED" }
  })
);

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
