import { apiClient } from "@/shared/api/client";

export type EventMessage = {
  id: string;
  eventId: string;
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
  content: string;
  createdAt: string;
};

/**
 * Mesajları Getir 🔒
 * GET /api/Events/{eventId}/messages
 */
export async function fetchEventMessages(
  eventId: string,
): Promise<EventMessage[]> {
  try {
    const response = await apiClient.get<EventMessage[]>(
      `/api/Events/${eventId}/messages`,
    );
    return response.data || [];
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Mesajlar yüklenemedi";
    throw new Error(message);
  }
}

/**
 * Mesaj Gönder 🔒
 * POST /api/Events/{eventId}/messages
 */
export async function sendEventMessage(
  eventId: string,
  content: string,
): Promise<EventMessage> {
  try {
    const response = await apiClient.post<EventMessage>(
      `/api/Events/${eventId}/messages`,
      { content },
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "Mesaj gönderilemedi";
    throw new Error(message);
  }
}
