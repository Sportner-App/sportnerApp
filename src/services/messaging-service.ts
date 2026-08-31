import { apiClient } from "@/lib/api/client";
import type { CursorPagedResult } from "@/types/api";
import type {
  ApiConversation,
  ApiConversationListItem,
  ApiMessage,
} from "@/types/messaging";

type ConversationPage = {
  items: ApiConversationListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export async function listMyConversations(options?: {
  type?: number;
}): Promise<ConversationPage> {
  const response = await apiClient.get<ConversationPage>("/api/conversations", {
    params: { page: 1, pageSize: 50, type: options?.type },
  });
  return {
    ...response.data,
    items: response.data?.items ?? [],
  };
}

export async function createDirectConversation(otherUserId: string) {
  const response = await apiClient.post<ApiConversation>(
    "/api/conversations/direct",
    { otherUserId },
  );
  return response.data;
}

export async function getConversation(conversationId: string) {
  const response = await apiClient.get<ApiConversation>(
    `/api/conversations/${conversationId}`,
  );
  return response.data;
}

export async function getEventConversation(eventId: string) {
  const response = await apiClient.get<ApiConversation>(
    `/api/events/${eventId}/conversation`,
  );
  return response.data;
}

export async function listMessages(
  conversationId: string,
  before?: string,
): Promise<CursorPagedResult<ApiMessage>> {
  const response = await apiClient.get<CursorPagedResult<ApiMessage>>(
    `/api/conversations/${conversationId}/messages`,
    { params: { before, limit: 30 } },
  );
  return {
    items: response.data?.items ?? [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function sendTextMessage(
  conversationId: string,
  content: string,
): Promise<ApiMessage> {
  const response = await apiClient.post<ApiMessage>(
    `/api/conversations/${conversationId}/messages`,
    { content },
  );
  return response.data;
}

export async function markConversationRead(
  conversationId: string,
  messageId: string,
) {
  await apiClient.post(`/api/conversations/${conversationId}/read`, {
    messageId,
  });
}
