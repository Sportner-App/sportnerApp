import { apiClient } from "@/shared/api/client";

import type { CompleteOnboardingPayload } from "@/features/onboarding/model/types";

function getFileExtension(fileUri: string) {
  const matched = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(fileUri);
  return (matched?.[1] ?? "jpg").toLowerCase();
}

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export async function uploadProfileAvatar(
  userId: string,
  avatarUri: string,
): Promise<string> {
  if (isRemoteUrl(avatarUri)) {
    return avatarUri;
  }

  const extension = getFileExtension(avatarUri);
  const fileName = `${userId}/${Date.now()}.${extension}`;

  const response = await fetch(avatarUri);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("userId", userId);

  try {
    const uploadResponse = await apiClient.post<{ url: string }>(
      "/api/profiles/upload-avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return uploadResponse.data.url || avatarUri;
  } catch (error) {
    console.error("Avatar upload failed:", error);
    throw new Error("Profil gorseli yukleme basarısız");
  }
}

export async function markOnboardingCompleted(userId: string) {
  return apiClient.patch(`/api/Profiles/me`, {
    isOnboarded: true,
  });
}

export async function getOnboardingStatus(userId: string) {
  return apiClient.get<{ isOnboarded: boolean }>(`/api/Profiles/me`);
}

export async function completeOnboarding(payload: CompleteOnboardingPayload) {
  const { userId, avatarUrl, bio, birthDate, sports, skillLevels } = payload;
  const resolvedAvatarUrl = avatarUrl
    ? await uploadProfileAvatar(userId, avatarUrl)
    : null;

  return apiClient.put(`/api/Profiles/me`, {
    avatarUrl: resolvedAvatarUrl,
    bio,
    birthDate: birthDate,
    sports,
    skillLevels: skillLevels ? JSON.stringify(skillLevels) : undefined,
    isOnboarded: true,
  });
}
