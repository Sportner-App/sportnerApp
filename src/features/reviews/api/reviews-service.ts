import { apiClient } from "@/shared/api/client";

export type Review = {
  id: string;
  eventId: string;
  reviewerId: string;
  reviewerFullName: string;
  reviewerAvatarUrl?: string;
  reviewedId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
};

export type CreateReviewPayload = {
  eventId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
};

/**
 * Değerlendirme Oluştur 🔒
 * POST /api/Reviews
 */
export async function createReview(
  payload: CreateReviewPayload,
): Promise<Review> {
  try {
    const response = await apiClient.post<Review>("/api/Reviews", payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Değerlendirme oluşturulamadı";
    throw new Error(message);
  }
}

/**
 * Kullanıcının Değerlendirmelerini Getir
 * GET /api/Reviews/user/{userId}
 */
export async function fetchUserReviews(userId: string): Promise<Review[]> {
  try {
    const response = await apiClient.get<Review[]>(
      `/api/Reviews/user/${userId}`,
    );
    return response.data || [];
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Değerlendirmeler yüklenemedi";
    throw new Error(message);
  }
}
