import { apiClient } from "@/lib/api/client";
import { toCursorPage } from "@/lib/api/pagination";
import type { CursorPagedResult } from "@/types/api";
import type { ApiComment, ApiPost } from "@/features/feed/types";
import type { PickedMedia } from "@/utils/media-picker";

export async function getHomeFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>(
    "/api/feed",
    {
      params: { before, limit: 20 },
    },
  );
  return toCursorPage(response.data, normalizePost);
}

export async function getExploreFeed(before?: string) {
  const response = await apiClient.get<CursorPagedResult<ApiPost>>(
    "/api/feed/explore",
    { params: { before, limit: 20 } },
  );
  return toCursorPage(response.data, normalizePost);
}

export async function explorePosts(limit = 36, friendsOnly = false) {
  const response = await apiClient.get<ApiPost[]>("/api/explore/posts", {
    params: { limit, friendsOnly: friendsOnly || undefined },
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
    mentions: post.mentions ?? [],
  };
}

export async function getPost(postId: string) {
  const response = await apiClient.get<ApiPost>(`/api/posts/${postId}`);
  return response.data ? normalizePost(response.data) : response.data;
}

export async function createPost(
  content: string,
  files: PickedMedia[] = [],
  mentionedUserIds: string[] = [],
) {
  const form = new FormData();
  const caption = content.trim();
  if (caption) {
    form.append("content", caption);
  }

  // Multipart istek: her etiket ayrı bir alan olarak gidiyor.
  for (const userId of mentionedUserIds) {
    form.append("mentionedUserIds", userId);
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
  return toCursorPage(response.data);
}

export async function createComment(
  postId: string,
  content: string,
  mentionedUserIds: string[] = [],
) {
  const response = await apiClient.post<ApiComment>(
    `/api/posts/${postId}/comments`,
    { content, mentionedUserIds },
  );
  return response.data;
}

export async function listReplies(
  postId: string,
  commentId: string,
  before?: string,
) {
  const response = await apiClient.get<CursorPagedResult<ApiComment>>(
    `/api/posts/${postId}/comments/${commentId}/replies`,
    { params: { before, limit: 30 } },
  );
  return toCursorPage(response.data);
}

export async function createReply(
  postId: string,
  parentCommentId: string,
  content: string,
  mentionedUserIds: string[] = [],
) {
  const response = await apiClient.post<ApiComment>(
    `/api/posts/${postId}/comments/${parentCommentId}/replies`,
    { content, mentionedUserIds },
  );
  return response.data;
}
