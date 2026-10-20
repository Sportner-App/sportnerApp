import { apiClient } from "@/lib/api/client";

export type AppRelease = {
  /** Boşsa zorunluluk kapalı demektir. */
  minimumVersion: string | null;
  storeUrl: string | null;
};

export async function getAppRelease(platform: string): Promise<AppRelease> {
  const response = await apiClient.get<AppRelease>("/api/app/release", {
    params: { platform },
  });

  return response.data;
}
