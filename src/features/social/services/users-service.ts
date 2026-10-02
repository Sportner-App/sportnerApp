import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/types/api";
import type { ApiDiscoverUser, PagedUsers } from "@/features/social/types";
import { formatFullName } from "@/utils/person";

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
        formatFullName(user.firstName, user.lastName) ||
        user.username ||
        i18n.t("events:fallback.athlete"),
      avatarUrl: user.profileImageUrl,
      city: user.city,
    })),
    page: result?.page ?? page,
    totalCount: result?.totalCount ?? 0,
    hasNext: Boolean(result?.hasNext),
  };
}
