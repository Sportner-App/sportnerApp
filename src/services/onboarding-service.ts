import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import type { UserSportResponse } from "@/types/onboarding";

export async function listMySports(): Promise<UserSportResponse[]> {
  const response = await apiClient.get<UserSportResponse[]>("/api/me/sports");
  return response.data ?? [];
}

export async function addMySport(payload: {
  sportId: string;
  skillLevel: number;
  isPrimary?: boolean;
}): Promise<UserSportResponse[]> {
  const response = await apiClient.post<UserSportResponse[]>("/api/me/sports", {
    sportId: payload.sportId,
    skillLevel: payload.skillLevel,
    isPrimary: payload.isPrimary ?? false,
  });
  return response.data ?? [];
}

export async function addMySports(
  sports: Array<{
    sportId: string;
    skillLevel: number;
    isPrimary?: boolean;
  }>,
): Promise<UserSportResponse[]> {
  const response = await apiClient.post<UserSportResponse[]>(
    "/api/me/sports/batch",
    {
      sports: sports.map((sport) => ({
        sportId: sport.sportId,
        skillLevel: sport.skillLevel,
        isPrimary: sport.isPrimary ?? false,
      })),
    },
  );
  return response.data ?? [];
}

/** Idempotent: 409 AlreadyAdded is treated as success. */
export async function addMySportSafe(payload: {
  sportId: string;
  skillLevel: number;
  isPrimary?: boolean;
}): Promise<void> {
  try {
    await addMySport(payload);
  } catch (error) {
    const apiError = normalizeApiError(error);
    if (apiError.status === 409 || apiError.code === "UserSport.AlreadyAdded") {
      return;
    }
    throw error;
  }
}

export async function createMyProfile(payload: {
  username: string;
  firstName: string;
  lastName?: string | null;
  bio?: string | null;
  city?: string | null;
}): Promise<void> {
  await apiClient.post("/api/user-profiles/me", {
    username: payload.username,
    firstName: payload.firstName,
    lastName: payload.lastName ?? null,
    bio: payload.bio ?? null,
    city: payload.city ?? null,
    isProfilePublic: true,
  });
}

export async function updateMyBio(bio: string | null): Promise<void> {
  await apiClient.put("/api/user-profiles/me/bio", { bio });
}

export async function updateMyCity(city: string | null): Promise<void> {
  await apiClient.put("/api/user-profiles/me/location", { city });
}

function isProfileNotFound(error: unknown) {
  const apiError = normalizeApiError(error);
  if (apiError.status !== 404) {
    return false;
  }

  if (apiError.code === "Profile.NotFound") {
    return true;
  }

  const details = apiError.details;
  if (details && typeof details === "object" && "errors" in details) {
    const errors = (details as { errors?: Array<{ code?: string }> }).errors;
    return Boolean(errors?.some((item) => item.code === "Profile.NotFound"));
  }

  return /profile was not found/i.test(apiError.message);
}

/**
 * Ensures profile exists, then applies optional city/bio.
 * Uses GET first so we don't spam a failed PUT when the profile row is missing.
 */
export async function upsertOnboardingProfileDetails(payload: {
  city?: string;
  bio?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  const trimmedCity = payload.city?.trim() || null;
  const trimmedBio = payload.bio?.trim() || null;

  let profileExists = true;
  try {
    await apiClient.get("/api/user-profiles/me");
  } catch (error) {
    if (!isProfileNotFound(error)) {
      throw error;
    }
    profileExists = false;
  }

  if (!profileExists) {
    const username = payload.username?.trim();
    const firstName = payload.firstName?.trim() || username;
    if (!username || !firstName) {
      throw new Error(
        "Profil bulunamadı. Çıkış yapıp aynı hesapla tekrar kayıt / giriş dene.",
      );
    }

    await createMyProfile({
      username,
      firstName,
      lastName: payload.lastName?.trim() || null,
      city: trimmedCity,
      bio: trimmedBio,
    });
    return;
  }

  if (trimmedCity) {
    await updateMyCity(trimmedCity);
  }
  if (trimmedBio) {
    await updateMyBio(trimmedBio);
  }
}

/**
 * POST /api/me/onboarding/complete — 204
 * Requires profile + at least one sport.
 */
export async function completeOnboarding(): Promise<{
  error: { message: string } | null;
}> {
  try {
    await apiClient.post("/api/me/onboarding/complete");
    return { error: null };
  } catch (error) {
    return {
      error: {
        message: getApiErrorMessage(error, "Profil kurulumu tamamlanamadı"),
      },
    };
  }
}

export async function markLocalOnboardingComplete(): Promise<void> {
  const user = await apiClient.getUser();
  if (!user) {
    return;
  }

  await apiClient.setUser({
    ...user,
    isOnboarded: true,
    isNewUser: false,
  });
}
