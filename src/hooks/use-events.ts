import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getEvents } from "@/services/events-service";
import { listSports } from "@/services/sports-service";
import type { EventSummary } from "@/types/events";
import type { Sport } from "@/types/sports";

const PAGE_SIZE = 30;

export function useEvents() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sportFilter, setSportFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const resolveSportId = useCallback(
    (filterSlug: string, catalog: Sport[]) =>
      filterSlug === "all"
        ? undefined
        : catalog.find((sport) => sport.slug === filterSlug)?.id,
    [],
  );

  const fetchPage = useCallback(
    async (
      mode: "initial" | "refresh" | "more",
      filterSlug: string,
      catalog: Sport[],
      nextPage: number,
    ) => {
      if (mode === "initial") {
        setIsLoading(true);
      } else if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        setError(null);
        const result = await getEvents({
          sportId: resolveSportId(filterSlug, catalog),
          page: nextPage,
          pageSize: PAGE_SIZE,
        });

        setEvents((prev) =>
          mode === "more" ? [...prev, ...result.items] : result.items,
        );
        setTotalCount(result.totalCount);
        setPage(result.page);
        setHasNext(result.hasNext);
      } catch (err) {
        setError(getApiErrorMessage(err, "Etkinlikler yüklenemedi."));
        if (mode !== "more") {
          setEvents([]);
          setTotalCount(0);
          setHasNext(false);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [resolveSportId],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const catalog = await listSports();
        if (cancelled) {
          return;
        }

        setSports(catalog);
        await fetchPage("initial", "all", catalog, 1);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(getApiErrorMessage(err, "Etkinlikler yüklenemedi."));
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const refresh = useCallback(() => {
    void fetchPage("refresh", sportFilter, sports, 1);
  }, [fetchPage, sportFilter, sports]);

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) {
      return;
    }
    void fetchPage("more", sportFilter, sports, page + 1);
  }, [fetchPage, hasNext, isLoadingMore, page, sportFilter, sports]);

  const changeSportFilter = useCallback(
    (slug: string) => {
      setSportFilter(slug);
      void fetchPage("initial", slug, sports, 1);
    },
    [fetchPage, sports],
  );

  return {
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    sportFilter,
    setSportFilter: changeSportFilter,
    refresh,
    loadMore,
    error,
  };
}
