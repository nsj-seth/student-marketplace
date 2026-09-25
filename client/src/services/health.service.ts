import { apiRequest } from "./api";

export interface HealthData {
  status: string;
  service: string;
  timestamp: string;
}

export function getApiHealth() {
  return apiRequest<HealthData>("/health");
}
