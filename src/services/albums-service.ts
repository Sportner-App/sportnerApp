import { apiClient } from "@/lib/api/client";
import type { ApiAlbum, ApiAlbumDetail } from "@/types/social";

export async function listMyAlbums() {
  const response = await apiClient.get<ApiAlbum[]>("/api/albums/me");
  return response.data ?? [];
}

export async function getAlbum(albumId: string) {
  const response = await apiClient.get<ApiAlbumDetail>(`/api/albums/${albumId}`);
  return response.data;
}

export async function createAlbum(title: string, description?: string) {
  const response = await apiClient.post<ApiAlbum>("/api/albums", {
    title,
    description: description || null,
    visibility: 0,
  });
  return response.data;
}

export async function addAlbumMedia(
  albumId: string,
  file: { uri: string; name: string; type: string },
) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  await apiClient.post(`/api/albums/${albumId}/media`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function listEventAlbums(eventId: string) {
  const response = await apiClient.get<ApiAlbum[]>(
    `/api/events/${eventId}/albums`,
  );
  return response.data ?? [];
}
