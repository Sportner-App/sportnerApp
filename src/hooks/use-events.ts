import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getEvents } from "@/services/events-service";
import type { EventSummary } from "@/types/events";

const PAGE_SIZE = 30;
export const DEFAULT_EVENT_FILTERS: EventListFilters = {
  city: null,
  minAge: 13,
  maxAge: 120,
  gender: null,
  skillLevel: null,
  isPaid: null,
  organizationId: null,
  sportId: null,
};

export type EventListFilters = {
  city: string | null;
  minAge: number;
  maxAge: number;
  gender: number | null;
  skillLevel: number | null;
  isPaid: boolean | null;
  organizationId: string | null;
  /** Tek bir spor branşı (filtre çekmecesinden seçilir). */
  sportId: string | null;
};

export type EventFeedScope = "all" | "friends" | "organizations";

/** Listeyi yakından uzağa sıralamak için kullanıcının konumu. */
export type EventFeedOrigin = {
  latitude: number;
  longitude: number;
} | null;

export function useEvents(
  initialScope: EventFeedScope = "all",
  initialOrganizationId: string | null = null,
  origin: EventFeedOrigin = null,
) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** Chip satırındaki kategori filtresi (kategori id'si; null = Tümü). */
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [scope, setScope] = useState<EventFeedScope>(initialScope);
  const [filters, setFilters] = useState<EventListFilters>({
    ...DEFAULT_EVENT_FILTERS,
    organizationId: initialOrganizationId,
  });
  const [error, setError] = useState<string | null>(null);

  // Konum ortam bilgisi: her çağrı yerinde argüman olarak taşımak yerine
  // ref'ten okunuyor, böylece fetchPage'in imzası ve bağımlılıkları sabit kalır.
  const originRef = useRef(origin);
  originRef.current = origin;

  const fetchPage = useCallback(
    async (
      mode: "initial" | "refresh" | "more",
      activeCategoryId: string | null,
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
        const activeOrigin = originRef.current;
        const result = await getEvents({
          sportId: activeFilters.sportId ?? undefined,
          sportCategoryId: activeCategoryId ?? undefined,
          city: activeFilters.city ?? undefined,
          // Konum verilirse backend listeyi yakından uzağa sıralar.
          lat: activeOrigin?.latitude,
          lng: activeOrigin?.longitude,
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
    [],
  );

  // Ekran her odaklandığında (ör. etkinlik oluşturma/düzenlemeden geri
  // dönüldüğünde) listeyi arka planda sessizce tazelemek için en güncel
  // filtre/scope/kategori değerlerini ref'lerde tutuyoruz — böylece
  // useFocusEffect yalnızca gerçek focus/blur geçişlerinde tetiklenir,
  // her filtre değişiminde değil (o değişimler zaten kendi fetchPage
  // çağrısını yapıyor).
  const categoryFilterRef = useRef(categoryFilter);
  const scopeRef = useRef(scope);
  const filtersRef = useRef(filters);

  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void (async () => {
        const isFirstLoad = !hasLoadedRef.current;
        hasLoadedRef.current = true;

        try {
          await fetchPage(
            isFirstLoad ? "initial" : "refresh",
            categoryFilterRef.current,
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

  // Konum ilk açılışta listeden sonra gelir (izin + GPS ölçümü). Geldiğinde
  // ilk sayfayı sessizce tazeliyoruz ki sıralama yakından uzağa dönsün.
  // Anahtarı 3 basamağa yuvarlıyoruz (~100 m): son bilinen konum ile taze
  // ölçüm arasındaki küçük fark ve GPS titremesi yeniden istek doğurmasın.
  const originKey = origin
    ? `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}`
    : "";
  const lastOriginKeyRef = useRef(originKey);

  useEffect(() => {
    if (originKey === lastOriginKeyRef.current) {
      return;
    }
    lastOriginKeyRef.current = originKey;

    if (!hasLoadedRef.current) {
      return;
    }

    void fetchPage(
      "refresh",
      categoryFilterRef.current,
      1,
      filtersRef.current,
      scopeRef.current,
    );
  }, [fetchPage, originKey]);

  const refresh = useCallback(() => {
    void fetchPage("refresh", categoryFilter, 1, filters, scope);
  }, [categoryFilter, fetchPage, filters, scope]);

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) {
      return;
    }
    void fetchPage("more", categoryFilter, page + 1, filters, scope);
  }, [
    categoryFilter,
    fetchPage,
    filters,
    hasNext,
    isLoadingMore,
    page,
    scope,
  ]);

  const changeCategoryFilter = useCallback(
    (nextCategoryId: string | null) => {
      setCategoryFilter(nextCategoryId);
      void fetchPage("initial", nextCategoryId, 1, filters, scope);
    },
    [fetchPage, filters, scope],
  );

  const applyFilters = useCallback(
    (nextFilters: EventListFilters) => {
      setFilters(nextFilters);
      void fetchPage("initial", categoryFilter, 1, nextFilters, scope);
    },
    [categoryFilter, fetchPage, scope],
  );

  const changeScope = useCallback(
    (nextScope: EventFeedScope) => {
      const nextFilters = { ...filters, organizationId: null };
      setScope(nextScope);
      setFilters(nextFilters);
      void fetchPage("initial", categoryFilter, 1, nextFilters, nextScope);
    },
    [categoryFilter, fetchPage, filters],
  );

  return {
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    categoryFilter,
    setCategoryFilter: changeCategoryFilter,
    scope,
    setScope: changeScope,
    filters,
    applyFilters,
    refresh,
    loadMore,
    error,
  };
}
