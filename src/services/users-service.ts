import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/types/events";
import type { ApiDiscoverUser, PagedUsers } from "@/types/users";

export async function discoverUsers({
  page = 1,
  pageSize = 20,
  search,
  sportId,
  city,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sportId?: string;
  city?: string;
} = {}): Promise<PagedUsers> {
  const response = await apiClient.get<PagedResult<ApiDiscoverUser>>(
    "/api/users/discover",
    { params: { page, pageSize, search, sportId, city } },
  );
  const result = response.data;

  return {
    items: (result?.items ?? []).map((user) => ({
      userId: user.userId,
      username: user.username,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.username ||
        "Sporcu",
      avatarUrl: user.profileImageUrl,
      city: user.city,
    })),
    page: result?.page ?? page,
    totalCount: result?.totalCount ?? 0,
    hasNext: Boolean(result?.hasNext),
  };
}
