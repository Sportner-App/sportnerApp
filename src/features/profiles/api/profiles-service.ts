import { apiClient } from "@/shared/api/client";

export type UserProfile = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  sports?: string[];
  introVideoUrl?: string;
  isOnboarded: boolean;
  birthDate?: string;
  skillLevels?: string; // JSON string olarak dönüyor
  avgRating?: number;
  reviewCount?: number;
  pushToken?: string;
  updatedAt?: string;
};

/**
 * Kendi Profilini Getir 🔒
 * GET /api/Profiles/me
 */
export async function fetchMyProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>("/api/Profiles/me");
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Profil bilgileri alınamadı";
    throw new Error(message);
  }
}

/**
 * Başka Bir Kullanıcının Profilini Getir 🔒
 * GET /api/Profiles/{userId}
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>(
      `/api/Profiles/${userId}`,
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Kullanıcı profili alınamadı";
    throw new Error(message);
  }
}

export type UpdateProfilePayload = {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  sports?: string[];
  introVideoUrl?: string;
  birthDate?: string;
  isOnboarded?: boolean;
  skillLevels?: Record<string, string>;
};

/**
 * Kendi Profilini Güncelle 🔒
 * PUT /api/Profiles/me
 */
export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const data = {
      ...payload,
      // skillLevels JSON object ise stringify yap
      skillLevels:
        payload.skillLevels && typeof payload.skillLevels === "object"
          ? JSON.stringify(payload.skillLevels)
          : payload.skillLevels,
    };

    const response = await apiClient.put<UserProfile>("/api/Profiles/me", data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Profil güncellemesi başarısız";
    throw new Error(message);
  }
}
