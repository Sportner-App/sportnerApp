import { apiClient } from "@/lib/api/client";
import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import type {
  ApiMyProfile,
  ApiPublicProfile,
  UserProfile,
} from "@/types/profile";
import { mapMyProfile, mapPublicProfile } from "@/utils/profile";

export class ProfileNotFoundError extends Error {
  constructor(message = "Profil bulunamadı.") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

/**
 * GET /api/user-profiles/me
 */
export async function getMyProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get<ApiMyProfile>("/api/user-profiles/me");

    if (!response.data) {
      throw new ProfileNotFoundError();
    }

    return mapMyProfile(response.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ProfileNotFoundError(
        getApiErrorMessage(error, "Profil bulunamadı."),
      );
    }

    throw error;
  }
}

export async function getPublicProfile(userId: string): Promise<UserProfile> {
  const response = await apiClient.get<ApiPublicProfile>(
    `/api/user-profiles/${userId}`,
  );
  if (!response.data) {
    throw new ProfileNotFoundError();
  }
  return mapPublicProfile(response.data);
}

export async function updateDisplayName(
  firstName: string,
  lastName?: string | null,
) {
  await apiClient.put("/api/user-profiles/me/display-name", {
    firstName,
    lastName: lastName || null,
  });
}

export async function updateUsername(username: string) {
  await apiClient.put("/api/user-profiles/me/username", { username });
}

export async function updatePersonalDetails(
  gender: number | null,
  birthDate: string | null,
) {
  await apiClient.put("/api/user-profiles/me/personal-details", {
    gender,
    birthDate,
  });
}

export async function updateBio(bio: string | null) {
  await apiClient.put("/api/user-profiles/me/bio", { bio });
}

export async function updateCity(city: string | null) {
  await apiClient.put("/api/user-profiles/me/location", { city });
}

export async function updateVisibility(isProfilePublic: boolean) {
  await apiClient.put("/api/user-profiles/me/visibility", { isProfilePublic });
}

function appendMedia(file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  return form;
}

export async function uploadAvatar(file: {
  uri: string;
  name: string;
  type: string;
}) {
  await apiClient.put("/api/user-profiles/me/avatar", appendMedia(file), {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function uploadIntroVideo(file: {
  uri: string;
  name: string;
  type: string;
}) {
  await apiClient.put("/api/user-profiles/me/intro-video", appendMedia(file), {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function updateSportSkill(sportId: string, skillLevel: number) {
  await apiClient.put(`/api/me/sports/${sportId}`, { skillLevel });
}

export async function setPrimarySport(sportId: string) {
  await apiClient.put(`/api/me/sports/${sportId}/primary`);
}

export async function removeMySport(sportId: string) {
  await apiClient.delete(`/api/me/sports/${sportId}`);
}
