import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { usePaginatedList } from "@/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listPublicOrganizations } from "@/features/organizations/services/organizations-service";
import type { ApiOrganizationSummary } from "@/features/organizations/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Herkese açık kulüpler: debounce'lu arama + sayfalı liste. */
export function useExploreClubs() {
  const { t } = useTranslation("organizations");
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(normalizedQuery),
      normalizedQuery ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  const fetchPage = useCallback(
    async (page: number | null) => {
      setError(null);
      const result = await listPublicOrganizations({
        search: debouncedSearch || undefined,
        page: page ?? 1,
        pageSize: PAGE_SIZE,
      });
      return {
        items: result.items,
        nextCursor: result.hasNext ? result.page + 1 : null,
        totalCount: result.totalCount,
      };
    },
    [debouncedSearch],
  );

  const list = usePaginatedList<ApiOrganizationSummary, number>(fetchPage, {
    getKey: (club) => club.id,
    onError: (reason) =>
      setError(getApiErrorMessage(reason, t("explore.loadFailed"))),
  });

  return {
    ...list,
    query,
    setQuery,
    error,
    isSearching: debouncedSearch.length > 0,
  };
}

export type ExploreClubsState = ReturnType<typeof useExploreClubs>;
