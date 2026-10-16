import { apiClient } from "@/lib/api/client";
import { toCursorPage } from "@/lib/api/pagination";
import type { CursorPagedResult, PagedResult } from "@/types/api";
import type {
  ApiConversation,
  ApiConversationListItem,
  ApiMessage,
} from "@/features/messaging/types";

type ConversationPage = PagedResult<ApiConversationListItem>;

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

/** Header rozeti için tüm konuşmalarda en az bir okunmamış mesaj olup olmadığını döner. */
export async function hasUnreadConversations(): Promise<boolean> {
  const response = await apiClient.get<boolean>(
    "/api/conversations/unread-status",
  );
  return response.data === true;
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
  return toCursorPage(response.data);
}

export async function sendTextMessage(
  conversationId: string,
  content: string,
  mentionedUserIds: string[] = [],
): Promise<ApiMessage> {
  const response = await apiClient.post<ApiMessage>(
    `/api/conversations/${conversationId}/messages`,
    { content, mentionedUserIds },
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

export async function deleteConversation(conversationId: string) {
  await apiClient.delete(`/api/conversations/${conversationId}`);
}
