import type { Challenge } from "@/features/challenges/types";
import { apiClient } from "@/lib/api/client";

export async function listChallenges(): Promise<Challenge[]> {
  const response = await apiClient.get<Challenge[]>("/api/challenges");
  return response.data ?? [];
}

export async function joinChallenge(id: string): Promise<Challenge | null> {
  const response = await apiClient.post<Challenge>(`/api/challenges/${id}/join`);
  return response.data ?? null;
}

export async function leaveChallenge(id: string): Promise<Challenge | null> {
  const response = await apiClient.delete<Challenge>(`/api/challenges/${id}/join`);
  return response.data ?? null;
}

export async function listChallengeMedals(userId: string): Promise<Challenge[]> {
  const response = await apiClient.get<Challenge[]>(
    `/api/challenges/medals/${userId}`,
  );
  return response.data ?? [];
}
