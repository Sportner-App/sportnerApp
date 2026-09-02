import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getEvents } from "@/services/events-service";
import { listSports } from "@/services/sports-service";
import type { EventSummary } from "@/types/events";
import type { Sport } from "@/types/sports";

const PAGE_SIZE = 30;
export const DEFAULT_EVENT_FILTERS: EventListFilters = {
  city: null,
  minAge: 13,
  maxAge: 120,
  gender: null,
  skillLevel: null,
  isPaid: null,
  organizationId: null,
};

export type EventListFilters = {
  city: string | null;
  minAge: number;
  maxAge: number;
  gender: number | null;
  skillLevel: number | null;
  isPaid: boolean | null;
  organizationId: string | null;
};

export type EventFeedScope = "all" | "friends" | "organizations";

export function useEvents(
  initialScope: EventFeedScope = "all",
  initialOrganizationId: string | null = null,
) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sportFilter, setSportFilter] = useState("all");
  const [scope, setScope] = useState<EventFeedScope>(initialScope);
  const [filters, setFilters] = useState<EventListFilters>({
    ...DEFAULT_EVENT_FILTERS,
    organizationId: initialOrganizationId,
  });
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
      activeFilters: EventListFilters,
      activeScope: EventFeedScope,
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
          city: activeFilters.city ?? undefined,
          page: nextPage,
          pageSize: PAGE_SIZE,
          minAge:
            activeFilters.minAge === DEFAULT_EVENT_FILTERS.minAge
              ? undefined
              : activeFilters.minAge,
          maxAge:
            activeFilters.maxAge === DEFAULT_EVENT_FILTERS.maxAge
              ? undefined
              : activeFilters.maxAge,
          gender: activeFilters.gender ?? undefined,
          skillLevel: activeFilters.skillLevel ?? undefined,
          isPaid: activeFilters.isPaid ?? undefined,
          friendsOnly: activeScope === "friends",
          organizationsOnly: activeScope === "organizations",
          organizationId:
            activeScope === "organizations"
              ? (activeFilters.organizationId ?? undefined)
              : undefined,
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

  // Ekran her odaklandığında (ör. etkinlik oluşturma/düzenlemeden geri
  // dönüldüğünde) listeyi arka planda sessizce tazelemek için en güncel
  // filtre/scope/sport değerlerini ref'lerde tutuyoruz — böylece
  // useFocusEffect yalnızca gerçek focus/blur geçişlerinde tetiklenir,
  // her filtre değişiminde değil (o değişimler zaten kendi fetchPage
  // çağrısını yapıyor).
  const sportFilterRef = useRef(sportFilter);
  const scopeRef = useRef(scope);
  const filtersRef = useRef(filters);
  const sportsRef = useRef(sports);

  useEffect(() => {
    sportFilterRef.current = sportFilter;
  }, [sportFilter]);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    sportsRef.current = sports;
  }, [sports]);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void (async () => {
        const isFirstLoad = !hasLoadedRef.current;
        hasLoadedRef.current = true;

        try {
          let catalog = sportsRef.current;

          if (isFirstLoad) {
            setIsLoading(true);
            catalog = await listSports();
            if (cancelled) {
              return;
            }
            setSports(catalog);
            sportsRef.current = catalog;
          }

          await fetchPage(
            isFirstLoad ? "initial" : "refresh",
            sportFilterRef.current,
            catalog,
            1,
            filtersRef.current,
            scopeRef.current,
          );
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
    }, [fetchPage]),
  );

  const refresh = useCallback(() => {
    void fetchPage("refresh", sportFilter, sports, 1, filters, scope);
  }, [fetchPage, filters, scope, sportFilter, sports]);

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) {
      return;
    }
    void fetchPage("more", sportFilter, sports, page + 1, filters, scope);
  }, [
    fetchPage,
    filters,
    hasNext,
    isLoadingMore,
    page,
    scope,
    sportFilter,
    sports,
  ]);

  const changeSportFilter = useCallback(
    (slug: string) => {
      setSportFilter(slug);
      void fetchPage("initial", slug, sports, 1, filters, scope);
    },
    [fetchPage, filters, scope, sports],
  );

  const applyFilters = useCallback(
    (nextFilters: EventListFilters) => {
      setFilters(nextFilters);
      void fetchPage("initial", sportFilter, sports, 1, nextFilters, scope);
    },
    [fetchPage, scope, sportFilter, sports],
  );

  const changeScope = useCallback(
    (nextScope: EventFeedScope) => {
      const nextFilters = { ...filters, organizationId: null };
      setScope(nextScope);
      setFilters(nextFilters);
      void fetchPage(
        "initial",
        sportFilter,
        sports,
        1,
        nextFilters,
        nextScope,
      );
    },
    [fetchPage, filters, sportFilter, sports],
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
    scope,
    setScope: changeScope,
    filters,
    applyFilters,
    refresh,
    loadMore,
    error,
  };
}
