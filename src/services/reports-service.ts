import { apiClient } from "@/lib/api/client";
import type { ApiReportReason } from "@/types/social";

export async function listReportReasons() {
  const response = await apiClient.get<ApiReportReason[]>(
    "/api/report-reasons",
  );
  return response.data ?? [];
}

export async function createReport(payload: {
  entityType: number;
  entityId: string;
  reportReasonId: string;
  description?: string;
}) {
  await apiClient.post("/api/reports", payload);
}
