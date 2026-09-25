import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { findApplicationByIdForApplicant } from "../seller-applications/seller-application.repository.js";
import {
  findVerificationForApplication,
  findVerificationSecretsForApplication,
  markVerificationVerified,
  recordFailedAttempt,
  universityExistsAndIsActive,
  upsertVerificationChallenge
} from "./student-verification.repository.js";

const CODE_LIFETIME_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function verificationSecret() {
  const secret = env.VERIFICATION_CODE_SECRET ?? env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("Verification code secret is not configured.");
  }
  return secret;
}

function hashCode(code: string) {
  return createHmac("sha256", verificationSecret()).update(code).digest("hex");
}

function sameHash(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

async function sendVerificationEmail(email: string, code: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.NODE_ENV === "production") {
      throw new Error("Email delivery is not configured for production.");
    }
    return { delivery: "DEVELOPMENT" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "Student Marketplace verification code",
      html: `<p>Your Student Marketplace verification code is <strong>${code}</strong>.</p><p>It expires in ${CODE_LIFETIME_MINUTES} minutes.</p>`
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to send verification email: ${body}`);
  }

  return { delivery: "EMAIL" as const };
}

export function getStudentVerification(
  sellerApplicationId: string,
  applicantId: string
) {
  return findVerificationForApplication(sellerApplicationId, applicantId);
}

export async function requestStudentVerification(input: {
  applicantId: string;
  sellerApplicationId: string;
  universityId: string;
  studentEmail: string;
}) {
  const application = await findApplicationByIdForApplicant(
    input.sellerApplicationId,
    input.applicantId
  );

  if (!application) return { kind: "APPLICATION_NOT_FOUND" as const };
  if (application.status !== "DRAFT") return { kind: "APPLICATION_NOT_EDITABLE" as const };
  if (application.business_type !== "STUDENT_BUSINESS") {
    return { kind: "NOT_STUDENT_BUSINESS" as const };
  }

  const universityValid = await universityExistsAndIsActive(input.universityId);
  if (!universityValid) return { kind: "UNIVERSITY_NOT_FOUND" as const };

  const existing = await findVerificationSecretsForApplication(
    input.sellerApplicationId,
    input.applicantId
  );

  if (existing?.status === "VERIFIED") {
    return { kind: "ALREADY_VERIFIED" as const, verification: existing };
  }

  if (existing?.last_sent_at) {
    const secondsSinceLastSend =
      (Date.now() - new Date(existing.last_sent_at).getTime()) / 1000;
    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      return {
        kind: "TOO_SOON" as const,
        retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)
      };
    }
  }

  const code = String(randomInt(100000, 1000000));
  const codeExpiresAt = new Date(
    Date.now() + CODE_LIFETIME_MINUTES * 60 * 1000
  ).toISOString();

  const delivery = await sendVerificationEmail(input.studentEmail, code);
  const verification = await upsertVerificationChallenge({
    ...input,
    studentEmail: input.studentEmail.trim().toLowerCase(),
    codeHash: hashCode(code),
    codeExpiresAt
  });

  return {
    kind: "SENT" as const,
    verification,
    delivery: delivery.delivery,
    ...(delivery.delivery === "DEVELOPMENT" ? { developmentCode: code } : {})
  };
}

export async function confirmStudentVerification(input: {
  applicantId: string;
  sellerApplicationId: string;
  code: string;
}) {
  const application = await findApplicationByIdForApplicant(
    input.sellerApplicationId,
    input.applicantId
  );

  if (!application) return { kind: "APPLICATION_NOT_FOUND" as const };
  if (application.business_type !== "STUDENT_BUSINESS") {
    return { kind: "NOT_STUDENT_BUSINESS" as const };
  }

  const verification = await findVerificationSecretsForApplication(
    input.sellerApplicationId,
    input.applicantId
  );

  if (!verification) return { kind: "VERIFICATION_NOT_FOUND" as const };
  if (verification.status === "VERIFIED") {
    return { kind: "VERIFIED" as const, verification };
  }

  if (!verification.code_hash || !verification.code_expires_at) {
    return { kind: "NO_ACTIVE_CODE" as const };
  }

  if (new Date(verification.code_expires_at).getTime() <= Date.now()) {
    return { kind: "CODE_EXPIRED" as const };
  }

  if (verification.attempt_count >= MAX_ATTEMPTS) {
    return { kind: "TOO_MANY_ATTEMPTS" as const };
  }

  const valid = sameHash(hashCode(input.code), verification.code_hash);

  if (!valid) {
    const attempts = verification.attempt_count + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    await recordFailedAttempt(verification.id, attempts, failed);
    return {
      kind: failed ? ("TOO_MANY_ATTEMPTS" as const) : ("INVALID_CODE" as const),
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts)
    };
  }

  const updated = await markVerificationVerified(verification.id);
  return { kind: "VERIFIED" as const, verification: updated };
}
