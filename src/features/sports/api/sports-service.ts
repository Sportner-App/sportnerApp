import { apiClient } from "@/shared/api/client";

export type Sport = {
  id: string;
  name: string;
  iconName: string;
  category: string;
};

/**
 * Spor Branşlarını Listele
 * GET /api/Sports
 */
export async function fetchSports(): Promise<Sport[]> {
  try {
    const response = await apiClient.get<Sport[]>("/api/Sports");
    return response.data || [];
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Spor branşları yüklenemedi";
    throw new Error(message);
  }
}
