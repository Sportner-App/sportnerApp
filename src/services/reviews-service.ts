import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/types/events";
import type { ApiReview, ApiReviewablePeer } from "@/types/reviews";

export async function listEventReviews(eventId: string, page = 1) {
  const response = await apiClient.get<PagedResult<ApiReview>>(
    `/api/events/${eventId}/reviews`,
    { params: { page, pageSize: 20 } },
  );
  return response.data;
}

export async function listReviewablePeers(eventId: string) {
  const response = await apiClient.get<ApiReviewablePeer[]>(
    `/api/events/${eventId}/reviewable`,
  );
  return response.data ?? [];
}

export async function createReview(payload: {
  eventId: string;
  reviewedUserId: string;
  rating: number;
  comment?: string;
}) {
  const response = await apiClient.post<ApiReview>("/api/reviews", payload);
  return response.data;
}

export async function listUserReviews(userId: string, page = 1) {
  const response = await apiClient.get<PagedResult<ApiReview>>(
    `/api/users/${userId}/reviews`,
    { params: { page, pageSize: 20 } },
  );
  return response.data;
}
