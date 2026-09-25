export type StudentVerificationStatus = "UNVERIFIED" | "VERIFIED" | "FAILED";

export interface StudentVerificationRecord {
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
}

export interface PublicStudentVerification extends StudentVerificationRecord {
  university?: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;
}
