import {
  findSellerApplicationForAdmin,
  listSellerApplicationsForAdmin,
  reviewSellerApplicationRecord
} from "./admin-seller-application.repository.js";
import type { SellerApplicationStatus } from "../seller-applications/seller-application.types.js";

export function getSellerApplicationsForAdmin(status?: SellerApplicationStatus) {
  return listSellerApplicationsForAdmin(status);
}

export function getSellerApplicationForAdmin(id: string) {
  return findSellerApplicationForAdmin(id);
}

export async function reviewSellerApplication(input: {
  applicationId: string;
  adminId: string;
  decision: "APPROVE" | "REJECT";
  note?: string;
}) {
  const result = await reviewSellerApplicationRecord(input);
  if (result.kind !== "REVIEWED") return result;

  const application = await findSellerApplicationForAdmin(input.applicationId);
  return { kind: "REVIEWED" as const, result: result.result, application };
}
