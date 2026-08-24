import { apiClient } from "@/lib/api/client";
import type { CursorPagedResult } from "@/types/api";
import type { PagedResult } from "@/types/events";
import type {
  ApiComment,
  ApiFriend,
  ApiFriendship,
  ApiFriendSuggestion,
  ApiPost,
} from "@/types/social";

export async function listFriends(page = 1) {
  const response = await apiClient.get<PagedResult<ApiFriend>>(
    "/api/friendships",
    { params: { page, pageSize: 30 } },
  );
  return response.data;
}

export async function listPendingRequests(outgoing = false) {
  const response = await apiClient.get<ApiFriendship[]>(
    "/api/friendships/pending",
    { params: { outgoing } },
  );
  return response.data ?? [];
}

export async function listFriendSuggestions() {
  const response = await apiClient.get<ApiFriendSuggestion[]>(
    "/api/friendships/suggestions",
    { params: { limit: 20 } },
  );
  return response.data ?? [];
}

export async function sendFriendRequest(userId: string) {
  await apiClient.post("/api/friendships", { userId });
}

export async function acceptFriendRequest(friendshipId: string) {
  await apiClient.post(`/api/friendships/${friendshipId}/accept`);
}

export async function rejectFriendRequest(friendshipId: string) {
  await apiClient.post(`/api/friendships/${friendshipId}/reject`);
}

export async function removeFriendship(friendshipId: string) {
  await apiClient.delete(`/api/friendships/${friendshipId}`);
}

export async function getHomeFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>("/api/feed", {
    params: { before, limit: 20 },
  });
  return {
    items: response.data?.items ?? [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function getExploreFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>(
    "/api/feed/explore",
    { params: { before, limit: 20 } },
  );
  return {
    items: response.data?.items ?? [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function getPost(postId: string) {
  const response = await apiClient.get<ApiPost>(`/api/posts/${postId}`);
  return response.data;
}

export async function createPost(content: string) {
  const form = new FormData();
  form.append("content", content);
  const response = await apiClient.post<ApiPost>("/api/posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
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
