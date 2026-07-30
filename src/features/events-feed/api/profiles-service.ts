import { apiClient } from "@/shared/api/client";

export type ProfilePreview = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const UUID_V4_OR_VX_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeProfileIds(ids: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && UUID_V4_OR_VX_REGEX.test(id)),
    ),
  );
}

export async function fetchProfilesByIds(
  profileIds: Array<string | null | undefined>,
): Promise<ProfilePreview[]> {
  const ids: string[] = sanitizeProfileIds(profileIds);

  if (ids.length === 0) {
    return [];
  }

  try {
    // GET /api/profiles?ids=id1,id2,id3
    const response = await apiClient.get<{ profiles: ProfilePreview[] }>(
      "/api/profiles",
      {
        params: {
          ids: ids.join(","),
        },
      },
    );

    return response.data.profiles || [];
  } catch (error) {
    // Keep feed rendering alive even if profile preview query fails.
    console.warn("Profil önizlemesi yüklenemedi:", error);
    return [];
  }
}
