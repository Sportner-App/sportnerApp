import { apiClient } from "@/lib/api/client";
import type { CursorPagedResult } from "@/types/api";
import type { PagedResult } from "@/types/events";
import type { ApiProfileFriendship } from "@/types/profile";
import type {
  ApiComment,
  ApiFriend,
  ApiFriendship,
  ApiFriendSuggestion,
  ApiPost,
} from "@/types/social";
import type { PickedMedia } from "@/utils/media-picker";
import { FRIENDSHIP_STATUS } from "@/types/social";

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

export async function getHomeFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>(
    "/api/feed",
    {
      params: { before, limit: 20 },
    },
  );
  return {
    items: (response.data?.items ?? []).map(normalizePost),
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function getExploreFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>(
    "/api/feed/explore",
    { params: { before, limit: 20 } },
  );
  return {
    items: (response.data?.items ?? []).map(normalizePost),
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function explorePosts(limit = 36) {
  const response = await apiClient.get<ApiPost[]>("/api/explore/posts", {
    params: { limit },
  });
  return (response.data ?? []).map(normalizePost);
}

function normalizePost(post: ApiPost): ApiPost {
  const media = [...(post.media ?? [])].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );

  return {
    ...post,
    media,
    mediaCount: post.mediaCount ?? media.length,
  };
}

export async function getPost(postId: string) {
  const response = await apiClient.get<ApiPost>(`/api/posts/${postId}`);
  return response.data ? normalizePost(response.data) : response.data;
}

export async function createPost(content: string, files: PickedMedia[] = []) {
  const form = new FormData();
  const caption = content.trim();
  if (caption) {
    form.append("content", caption);
  }

  for (const file of files) {
    form.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

  const response = await apiClient.post<ApiPost>("/api/posts", form, {
    timeout: 60_000,
  });
  return response.data ? normalizePost(response.data) : response.data;
}

export async function likePost(postId: string) {
  await apiClient.post(`/api/posts/${postId}/likes`);
}

export async function unlikePost(postId: string) {
  await apiClient.delete(`/api/posts/${postId}/likes`);
}

export async function listComments(postId: string, before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiComment>>(
    `/api/posts/${postId}/comments`,
    { params: { before, limit: 30 } },
  );
  return {
    items: response.data?.items ?? [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function createComment(postId: string, content: string) {
  const response = await apiClient.post<ApiComment>(
    `/api/posts/${postId}/comments`,
    { content },
  );
  return response.data;
}
