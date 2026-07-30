/**
 * Profile Service - .NET Web API
 * Profil bilgilerini al ve güncelle
 */

import { apiClient, getStoredToken } from "@/shared/api/client";

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
  skillLevels?: Record<string, string>;
  avgRating?: number;
  reviewCount?: number;
  pushToken?: string;
  updatedAt?: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  bio?: string;
  birthDate?: string;
  avatarUrl?: string;
  sports?: string[];
  skillLevels?: Record<string, string>;
  introVideoUrl?: string;
  isOnboarded?: boolean;
};

/**
 * Helper: File extension'ı al
 */
function getFileExtension(fileUri: string) {
  const matched = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(fileUri);
  return (matched?.[1] ?? "jpg").toLowerCase();
}

/**
 * Helper: Remote URL mi kontrol et
 */
function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/**
 * Profil avatarını upload et
 * POST /api/Profiles/me/avatar (multipart/form-data)
 */
export async function uploadProfileAvatar(
  userId: string,
  avatarUri: string,
): Promise<string> {
  if (isRemoteUrl(avatarUri)) {
    return avatarUri;
  }

  const extension = getFileExtension(avatarUri);
  const fileName = `avatar.${extension}`;
  const mimeType = extension === "png" ? "image/png" : "image/jpeg";

  const formData = new FormData();
  // React Native FormData: URI object gönder (Blob değil!)
  formData.append("file", {
    uri: avatarUri,
    name: fileName,
    type: mimeType,
  } as any);

  try {
    const token = await getStoredToken();

    // FormData'yı doğrudan fetch ile gönder
    // React Native otomatik multipart/form-data encode eder
    const uploadResponse = await fetch(
      "http://localhost:5139/api/Profiles/me/avatar",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: formData,
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
      );
    }

    const data = (await uploadResponse.json()) as { avatarUrl: string };
    return data.avatarUrl || avatarUri;
  } catch (error) {
    console.error("Avatar upload failed:", error);
    throw new Error("Profil gorseli yukleme basarısız");
  }
}

/**
 * Kendi profili getir
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
 * Profil güncelle
 * PUT /api/Profiles/me
 */
export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const response = await apiClient.put<UserProfile>(
      "/api/Profiles/me",
      payload,
    );

    // User bilgilerini güncelle
    await apiClient.setUser(response.data);

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Profil güncelleme başarısız";
    throw new Error(message);
  }
}

/**
 * Başka bir kullanıcının profilini getir
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
