/**
 * Sports Service - .NET Web API
 * Spor branşları ve icon bilgilerini al
 */

import { apiClient } from "@/shared/api/client";

export type Sport = {
  id: string;
  name: string;
  iconName: string;
  category: string;
};

let sportsCachePromise: Promise<Sport[]> | null = null;

/**
 * Tüm spor branşlarını al ve cache'le
 */
export async function fetchSports(): Promise<Sport[]> {
  // Cache'lenmiş promise'i kullan
  if (!sportsCachePromise) {
    sportsCachePromise = (async () => {
      try {
        const response = await apiClient.get<Sport[]>("/api/Sports");
        return response.data || [];
      } catch (error) {
        console.error("Sports fetch failed:", error);
        return [];
      }
    })();
  }

  return sportsCachePromise;
}

/**
 * Sport type'ından icon name'i bul
 */
export async function getSportIconName(
  sportType: string | undefined,
): Promise<string> {
  if (!sportType) {
    return "HelpCircle";
  }

  try {
    const sports = await fetchSports();
    const sport = sports.find(
      (s) => s.id.toLowerCase() === sportType.toLowerCase(),
    );

    return sport?.iconName || "HelpCircle";
  } catch (error) {
    console.error("Getting sport icon name failed:", error);
    return "HelpCircle";
  }
}
