import { apiClient } from "@/lib/api/client";
import type { ListSportsParams, Sport, SportsPage } from "@/types/sports";

const DEFAULT_PAGE_SIZE = 50;

function normalizeSportsPage(data: SportsPage | Sport[] | null | undefined): SportsPage {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      pageSize: data.length,
      totalCount: data.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const items = data?.items ?? [];
  return {
    items,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? items.length,
    totalCount: data?.totalCount ?? items.length,
    totalPages: data?.totalPages ?? 1,
    hasPrevious: data?.hasPrevious ?? false,
    hasNext: data?.hasNext ?? false,
  };
}

export async function listSportsPage(
  params: ListSportsParams = {},
): Promise<SportsPage> {
  const search = params.search?.trim();
  const response = await apiClient.get<SportsPage | Sport[]>("/api/sports", {
    params: {
      ...(search ? { q: search } : {}),
      page: params.page ?? 1,
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
    },
  });

  return normalizeSportsPage(response.data);
}

/** Convenience: returns only the items (catalog / create-event / home). */
export async function listSports(
  params: ListSportsParams = {},
): Promise<Sport[]> {
  const page = await listSportsPage(params);
  return page.items;
}

export async function getSportBySlug(slug: string): Promise<Sport | null> {
  try {
    const response = await apiClient.get<Sport>(
      `/api/sports/${encodeURIComponent(slug)}`,
    );
    return response.data ?? null;
  } catch {
    return null;
  }
}
