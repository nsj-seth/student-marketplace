import "dotenv/config";
import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional()
);

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  FRONTEND_URLS: z.string().optional(),
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
  VERIFICATION_CODE_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === "production") {
    for (const key of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "VERIFICATION_CODE_SECRET"] as const) {
      if (!value[key]) {
        ctx.addIssue({ code: "custom", path: [key], message: `${key} is required in production.` });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

const rawAllowedOrigins = parsed.data.FRONTEND_URLS ?? parsed.data.FRONTEND_URL;
export const allowedOrigins = rawAllowedOrigins.split(",").map((value) => value.trim()).filter(Boolean);
export const env = parsed.data;
