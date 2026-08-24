import { apiClient } from "@/lib/api/client";
import type { ApiBadge, ApiQuest } from "@/types/social";

export async function listMyBadges() {
  const response = await apiClient.get<ApiBadge[]>("/api/badges/me");
  return response.data ?? [];
}

export async function listBadgeProgress() {
  const response = await apiClient.get<ApiBadge[]>("/api/badges/me/progress");
  return response.data ?? [];
}

export async function listMyQuests() {
  const response = await apiClient.get<ApiQuest[]>("/api/quests/me");
  return response.data ?? [];
}

export async function listQuests() {
  const response = await apiClient.get<ApiQuest[]>("/api/quests");
  return response.data ?? [];
}
