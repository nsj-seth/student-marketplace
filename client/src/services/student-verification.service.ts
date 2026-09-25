import { apiRequest } from "./api";

export type StudentVerificationStatus = "UNVERIFIED" | "VERIFIED" | "FAILED";

export interface StudentVerification {
  id: string;
  applicant_id: string;
  seller_application_id: string;
  university_id: string;
  student_email: string;
  status: StudentVerificationStatus;
  verification_method: "EMAIL_CODE";
  code_expires_at: string | null;
  attempt_count: number;
  last_sent_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  university?: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;
}

export interface VerificationRequestResult {
  verification: StudentVerification;
  delivery: "EMAIL" | "DEVELOPMENT" | "ALREADY_VERIFIED";
  developmentCode?: string;
}

export function getStudentVerification(sellerApplicationId: string) {
  return apiRequest<StudentVerification | null>(
    `/student-verifications/application/${sellerApplicationId}`
  );
}

export function requestStudentVerification(input: {
  sellerApplicationId: string;
  universityId: string;
  studentEmail: string;
}) {
  return apiRequest<VerificationRequestResult>("/student-verifications/request", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function confirmStudentVerification(input: {
  sellerApplicationId: string;
  code: string;
}) {
  return apiRequest<StudentVerification>("/student-verifications/confirm", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
