import type { IconName } from "./components";

/** Backend SkillLevel enum (short) */
export type SkillLevelCode = 0 | 1 | 2 | 3 | 4;

export type SkillLevelKey =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "professional";

/** API: ProfileSportResponse */
export type ProfileSport = {
  sportId: string;
  sportName: string;
  sportSlug: string;
  skillLevel: SkillLevelCode;
  isPrimary: boolean;
};

/** API: ProfileStatisticsResponse */
export type ProfileStatistics = {
  eventsJoined: number;
  eventsOrganized: number;
  eventsCompleted: number;
  eventsCancelled: number;
  attendanceRate: number;
  averageRating: number;
  totalReviews: number;
  friendsCount: number;
  postsCount: number;
  badgesCount: number;
};

/** API: MyProfileResponse — GET /api/user-profiles/me */
export type ApiMyProfile = {
  userId: string;
  username: string;
  firstName: string;
  lastName: string | null;
  bio: string | null;
  gender: number | null;
  birthDate: string | null;
  city: string | null;
  profileImageUrl: string | null;
  introVideoUrl: string | null;
  averageRating: number;
  reviewCount: number;
  isProfilePublic: boolean;
  usernameChangedAt: string;
  usernameChangeAvailableAt: string;
  sports: ProfileSport[];
  statistics: ProfileStatistics | null;
};

/** UI model mapped from API */
export type UserProfile = {
  userId: string;
  username: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  introVideoUrl: string | null;
  averageRating: number;
  reviewCount: number;
  isProfilePublic: boolean;
  sports: ProfileSport[];
  statistics: ProfileStatistics | null;
};

export type ProfileMenuItem = {
  key: string;
  label: string;
  description?: string;
  icon: IconName;
  danger?: boolean;
};

export type ProfileMenuGroup = {
  key: string;
  title: string;
  items: ProfileMenuItem[];
};
