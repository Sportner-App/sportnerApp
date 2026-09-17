import type {
  ApiMyProfile,
  ApiPublicProfile,
  UserProfile,
} from "@/types/profile";

export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age--;

  return age;
}

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
    gender: api.gender,
    birthDate: api.birthDate,
    age: calculateAge(api.birthDate),
    bio: api.bio,
    city: api.city,
    avatarUrl: api.profileImageUrl,
    averageRating: Number(api.averageRating) || 0,
    reviewCount: api.reviewCount ?? 0,
    isProfilePublic: api.isProfilePublic,
    usernameChangedAt: api.usernameChangedAt,
    usernameChangeAvailableAt: api.usernameChangeAvailableAt,
    sports: api.sports ?? [],
    statistics: api.statistics,
    friendship: null,
    email: api.email,
    isEmailVerified: api.isEmailVerified,
  };
}

export function mapPublicProfile(api: ApiPublicProfile): UserProfile {
  return {
    ...mapMyProfile({
      birthDate: null,
      isProfilePublic: true,
      usernameChangedAt: "",
      usernameChangeAvailableAt: "",
      email: null,
      isEmailVerified: false,
      ...api,
    }),
    // Public API returns a pre-computed age, never a raw birth date.
    age: api.age ?? null,
    friendship: api.friendship ?? null,
  };
}
