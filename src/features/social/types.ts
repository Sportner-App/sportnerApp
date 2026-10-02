import type { PageSummary } from "@/types/api";

export type ApiFriend = {
  friendshipId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  friendsSince: string;
};

export type ApiBlockedUser = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
};

export type ApiFriendship = {
  id: string;
  requesterUserId: string;
  requesterUsername: string | null;
  requesterFirstName: string | null;
  requesterProfileImageUrl: string | null;
  addresseeUserId: string;
  addresseeUsername: string | null;
  addresseeFirstName: string | null;
  addresseeProfileImageUrl: string | null;
  status: number;
  createdAt: string;
};

export const FRIENDSHIP_STATUS = {
  pending: 0,
  accepted: 1,
  rejected: 2,
  blocked: 3,
} as const;

export type ApiFriendSuggestion = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sharedSportNames: string[];
};

export type ApiDiscoverUser = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  city: string | null;
};

export type DiscoverUser = {
  userId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  city: string | null;
};

export type PagedUsers = PageSummary<DiscoverUser>;

/** API: ExplorePersonItemResponse */
export type ApiExplorePerson = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sameCity: boolean;
  sharedSportNames: string[];
};

export type ExplorePerson = {
  userId: string;
  username: string | null;
  firstName: string | null;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sameCity: boolean;
  sharedSportNames: string[];
};
