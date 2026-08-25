import type {
  ApiMyProfile,
  ApiPublicProfile,
  UserProfile,
} from "@/types/profile";

export function mapMyProfile(api: ApiMyProfile): UserProfile {
  const firstName = api.firstName?.trim() || "";
  const lastName = api.lastName?.trim() || null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || api.username;

  return {
    userId: api.userId,
    username: api.username,
    firstName,
    lastName,
    fullName,
    bio: api.bio,
    city: api.city,
    avatarUrl: api.profileImageUrl,
    introVideoUrl: api.introVideoUrl,
    averageRating: Number(api.averageRating) || 0,
    reviewCount: api.reviewCount ?? 0,
    isProfilePublic: api.isProfilePublic,
    sports: api.sports ?? [],
    statistics: api.statistics,
    friendship: null,
  };
}

export function mapPublicProfile(api: ApiPublicProfile): UserProfile {
  return {
    ...mapMyProfile({
      gender: null,
      birthDate: null,
      isProfilePublic: true,
      usernameChangedAt: "",
      usernameChangeAvailableAt: "",
      ...api,
    }),
    friendship: api.friendship ?? null,
  };
}
