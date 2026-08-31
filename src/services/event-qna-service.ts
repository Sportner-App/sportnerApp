import { apiClient } from "@/lib/api/client";
import type { ApiEventQuestion } from "@/types/event-qna";
import type { PagedResult } from "@/types/events";

export async function listEventQuestions(eventId: string, page = 1) {
  const response = await apiClient.get<PagedResult<ApiEventQuestion>>(
    `/api/events/${eventId}/questions`,
    { params: { page, pageSize: 20 } },
  );
  return {
    items: response.data?.items ?? [],
    hasNext: Boolean(response.data?.hasNext),
    page: response.data?.page ?? page,
  };
}

export async function askEventQuestion(eventId: string, content: string) {
  const response = await apiClient.post<ApiEventQuestion>(
    `/api/events/${eventId}/questions`,
    { content },
  );
  return response.data;
}

export async function replyToEventQuestion(
  eventId: string,
  questionId: string,
  content: string,
) {
  const response = await apiClient.post<ApiEventQuestion>(
    `/api/events/${eventId}/questions/${questionId}/replies`,
    { content },
  );
  return response.data;
}
