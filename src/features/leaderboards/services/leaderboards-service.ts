import type {
  DistrictCrown,
  DistrictLeaderboard,
  DistrictSummary,
  LeaderboardPeriod,
  MyDistrictStanding,
} from "@/features/leaderboards/types";
import { apiClient } from "@/lib/api/client";

export async function listDistricts(city?: string): Promise<DistrictSummary[]> {
  const response = await apiClient.get<DistrictSummary[]>(
    "/api/leaderboards/districts",
    { params: city ? { city } : undefined },
  );
  return response.data ?? [];
}

export async function getDistrictLeaderboard(params: {
  city: string;
  district: string;
  period: LeaderboardPeriod;
  sportId?: string | null;
}): Promise<DistrictLeaderboard | null> {
  const response = await apiClient.get<DistrictLeaderboard>(
    "/api/leaderboards/district",
    {
      params: {
        city: params.city,
        district: params.district,
        period: params.period,
        ...(params.sportId ? { sportId: params.sportId } : {}),
      },
    },
  );
  return response.data ?? null;
}

export async function getMyDistrictStanding(): Promise<MyDistrictStanding | null> {
  const response = await apiClient.get<MyDistrictStanding | null>(
    "/api/leaderboards/me",
  );
  return response.data ?? null;
}

export async function listDistrictCrowns(userId: string): Promise<DistrictCrown[]> {
  const response = await apiClient.get<DistrictCrown[]>(
    `/api/leaderboards/crowns/${userId}`,
  );
  return response.data ?? [];
}
