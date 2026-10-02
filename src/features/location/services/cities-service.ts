import { apiClient } from "@/lib/api/client";
import type { City } from "@/features/location/types";

export async function listCities(): Promise<City[]> {
  const response = await apiClient.get<City[]>("/api/cities");
  return response.data ?? [];
}
