import { apiClient } from "@/lib/api/client";

export type ApiAppFeedback = {
  id: string;
  createdAt: string;
};

export async function submitAppFeedback(content: string) {
  const response = await apiClient.post<ApiAppFeedback>("/api/feedback", {
    content,
  });
  return response.data;
}
