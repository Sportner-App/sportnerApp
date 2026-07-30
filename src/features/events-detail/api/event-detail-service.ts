import type { EventFeedItem } from "@/entities/event";
import { apiClient } from "@/shared/api/client";

import type {
  CreatorProfile,
  EventDetailData,
  ParticipantProfile,
  ParticipantStatus,
} from "@/features/events-detail/model/types";

export type EventDetailResponse = {
  event: EventFeedItem;
  creator: CreatorProfile | null;
  allParticipants: ParticipantProfile[];
  approvedParticipants: ParticipantProfile[];
  pendingParticipants: ParticipantProfile[];
};

/**
 * Etkinlik detayını .NET API'den çek
 * GET /api/events/{eventId}
 */
export async function fetchEventDetailData(
  eventId: string,
): Promise<EventDetailData> {
  try {
    const response = await apiClient.get<EventDetailResponse>(
      `/api/events/${eventId}`,
    );
    const data = response.data;

    return {
      event: data.event,
      creator: data.creator,
      allParticipants: data.allParticipants,
      approvedParticipants: data.approvedParticipants,
      pendingParticipants: data.pendingParticipants,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Etkinlik detayı alınamadı.";
    throw new Error(message);
  }
}

/**
 * Katılım isteği gönder
 * POST /api/Events/{id}/join
 */
export async function createParticipationRequest(
  eventId: string,
  userId: string,
) {
  try {
    await apiClient.post(`/api/Events/${eventId}/join`, {});
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Başvuru gönderilemedi.";
    throw new Error(message);
  }
}

/**
 * Etkinlikten ayrıl
 * DELETE /api/events/{eventId}/participants/{userId}
 */
export async function leaveEvent(eventId: string, userId: string) {
  try {
    await apiClient.delete(`/api/events/${eventId}/participants/${userId}`);
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "Ayrılma başarısız.";
    throw new Error(message);
  }
}

/**
 * Katılım durumunu güncelle (onayla/reddet)
 * PATCH /api/Events/{eventId}/participants/{userId}
 */
export async function setParticipationStatus(
  eventId: string,
  userId: string,
  status: ParticipantStatus,
) {
  try {
    await apiClient.patch(`/api/Events/${eventId}/participants/${userId}`, {
      status,
    });
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "İşlem başarısız.";
    throw new Error(message);
  }
}
