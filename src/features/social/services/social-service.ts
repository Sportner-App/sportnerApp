import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/types/api";
import type { ApiProfileFriendship } from "@/features/profile/types";
import { mapExplorePerson } from "@/features/social/mappers";
import {
  FRIENDSHIP_STATUS,
  type ApiBlockedUser,
  type ApiExplorePerson,
  type ApiFriend,
  type ApiFriendship,
  type ApiFriendSuggestion,
  type ExplorePerson,
} from "@/features/social/types";

export function sameUserId(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function asFriendshipList(data: ApiFriendship[] | null | undefined) {
  return Array.isArray(data) ? data : [];
}

export function toProfileFriendship(
  row: ApiFriendship | null | undefined,
): ApiProfileFriendship | null {
  if (!row?.id) {
    return null;
  }

  return {
    friendshipId: row.id,
    status: row.status,
    requesterUserId: row.requesterUserId,
    addresseeUserId: row.addresseeUserId,
  };
}

export async function resolveFriendshipWith(
  userId: string,
  { includeAccepted = false }: { includeAccepted?: boolean } = {},
): Promise<ApiProfileFriendship | null> {
  const [incoming, outgoing] = await Promise.all([
    listPendingRequests(false),
    listPendingRequests(true),
  ]);

  const incomingHit = incoming.find((row) =>
    sameUserId(row.requesterUserId, userId),
  );
  if (incomingHit) {
    return toProfileFriendship(incomingHit);
  }

  const outgoingHit = outgoing.find((row) =>
    sameUserId(row.addresseeUserId, userId),
  );
  if (outgoingHit) {
    return toProfileFriendship(outgoingHit);
  }

  if (!includeAccepted) {
    return null;
  }

  const friends = await listFriends();
  const friend = friends?.items?.find((row) => sameUserId(row.userId, userId));
  if (!friend) {
    return null;
  }

  return {
    friendshipId: friend.friendshipId,
    status: FRIENDSHIP_STATUS.accepted,
    requesterUserId: friend.userId,
    addresseeUserId: userId,
  };
}

export async function listFriends(page = 1, pageSize = 30) {
  const response = await apiClient.get<PagedResult<ApiFriend>>(
    "/api/friendships",
    { params: { page, pageSize } },
  );
  return response.data;
}

export async function listPendingRequests(outgoing = false) {
  const response = await apiClient.get<ApiFriendship[]>(
    "/api/friendships/pending",
    { params: { outgoing } },
  );
  return asFriendshipList(response.data);
}

export async function listFriendSuggestions() {
  const response = await apiClient.get<ApiFriendSuggestion[]>(
    "/api/friendships/suggestions",
    { params: { limit: 20 } },
  );
  return response.data ?? [];
}

export async function sendFriendRequest(userId: string) {
  const response = await apiClient.post<ApiFriendship>("/api/friendships", {
    userId,
  });
  return response.data;
}

export async function acceptFriendRequest(friendshipId: string) {
  const response = await apiClient.post<ApiFriendship>(
    `/api/friendships/${friendshipId}/accept`,
  );
  return response.data;
}

export async function rejectFriendRequest(friendshipId: string) {
  await apiClient.post(`/api/friendships/${friendshipId}/reject`);
}

export async function removeFriendship(friendshipId: string) {
  await apiClient.delete(`/api/friendships/${friendshipId}`);
}

export async function listBlockedUsers(page = 1, pageSize = 30) {
  const response = await apiClient.get<PagedResult<ApiBlockedUser>>(
    "/api/blocks",
    { params: { page, pageSize } },
  );
  return response.data;
}

export async function blockUser(userId: string) {
  const response = await apiClient.post<ApiBlockedUser>("/api/blocks", {
    userId,
  });
  return response.data;
}

export async function unblockUser(userId: string) {
  await apiClient.delete(`/api/blocks/${userId}`);
}

export async function explorePeople(params: {
  sportId?: string;
  city?: string;
  limit?: number;
}): Promise<ExplorePerson[]> {
  const response = await apiClient.get<ApiExplorePerson[]>(
    "/api/explore/people",
    { params: { ...params, limit: params.limit ?? 20 } },
  );
  return (response.data ?? []).map(mapExplorePerson);
}

/** Etiketleme seçicisi için arkadaş araması. */
export async function searchFriends(query: string, take = 8) {
  const response = await apiClient.get<ApiFriend[]>(
    "/api/friendships/search",
    { params: { q: query, take } },
  );
  return response.data ?? [];
}
