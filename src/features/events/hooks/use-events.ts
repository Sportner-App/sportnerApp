import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useTranslation } from "react-i18next";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getEvents } from "@/features/events/services/events-service";
import type { EventSummary } from "@/features/events/types";

const PAGE_SIZE = 5;
export const DEFAULT_EVENT_FILTERS: EventListFilters = {
  city: null,
  minAge: 13,
  maxAge: 120,
  gender: null,
  skillLevel: null,
  isPaid: null,
  organizationId: null,
  sportId: null,
  sortBy: "location",
};

export type EventSortBy = "location" | "time";

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
  /** "location": konuma göre yakından uzağa, "time": tarihe göre. */
  sortBy: EventSortBy;
};

export type EventFeedScope = "all" | "friends" | "organizations";

/** Listeyi yakından uzağa sıralamak için kullanıcının konumu. */
export type EventFeedOrigin = {
  latitude: number;
  longitude: number;
} | null;

type FetchMode = "initial" | "refresh" | "silent" | "more";

type EventQuery = {
  /** Chip satırındaki kategori (null = Tümü). */
  categoryId: string | null;
  filters: EventListFilters;
  scope: EventFeedScope;
};

export function useEvents(
  initialScope: EventFeedScope = "all",
  initialOrganizationId: string | null = null,
  origin: EventFeedOrigin = null,
) {
  const { t } = useTranslation("home");
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

  // Odak ve konum tazelemeleri en güncel sorguyu buradan okur; böylece
  // useFocusEffect yalnızca gerçek focus/blur geçişlerinde tetiklenir, her
  // filtre değişiminde değil (o değişimler zaten kendi fetchPage çağrısını yapar).
  const queryRef = useRef<EventQuery>({
    categoryId: categoryFilter,
    filters,
    scope,
  });
  queryRef.current = { categoryId: categoryFilter, filters, scope };

  // Filtre hızla değiştiğinde eski isteğin geç gelen yanıtı yeni listeyi
  // ezmesin, eski filtrenin "daha fazla" sayfası yeni listeye eklenmesin.
  const requestIdRef = useRef(0);
  const latestModeRef = useRef<FetchMode>("initial");

  const fetchPage = useCallback(
    async (mode: FetchMode, query: EventQuery, nextPage: number) => {
      const requestId = ++requestIdRef.current;
      latestModeRef.current = mode;
      const isLatest = () => requestId === requestIdRef.current;
      const setFlag =
        mode === "initial"
          ? setIsLoading
          : mode === "refresh"
            ? setIsRefreshing
            : mode === "more"
              ? setIsLoadingMore
              : null;
      setFlag?.(true);

      try {
        setError(null);
        const {
          categoryId,
          filters: activeFilters,
          scope: activeScope,
        } = query;
        const activeOrigin = originRef.current;
        // Konum verilirse backend listeyi yakından uzağa sıralar; "time" seçiliyken
        // konumu hiç göndermiyoruz ki backend tarihe göre sıralamaya düşsün.
        const useLocationSort = activeFilters.sortBy !== "time";
        const result = await getEvents({
          sportId: activeFilters.sportId ?? undefined,
          sportCategoryId: categoryId ?? undefined,
          city: activeFilters.city ?? undefined,
          lat: useLocationSort ? activeOrigin?.latitude : undefined,
          lng: useLocationSort ? activeOrigin?.longitude : undefined,
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
        if (!isLatest()) return;

        setEvents((prev) =>
          mode === "more" ? [...prev, ...result.items] : result.items,
        );
        setTotalCount(result.totalCount);
        setPage(result.page);
        setHasNext(result.hasNext);
      } catch (err) {
        if (!isLatest()) return;
        setError(getApiErrorMessage(err, t("loadFailed")));
        if (mode === "initial") {
          setEvents([]);
          setTotalCount(0);
          setHasNext(false);
        }
      } finally {
        // Aynı türden daha yeni bir istek sürüyorsa göstergeyi o kapatır.
        if (isLatest() || latestModeRef.current !== mode) {
          setFlag?.(false);
        }
      }
    },
    [t],
  );

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Odak, ekranlar arası native geçiş animasyonuyla aynı anda tetiklenir
      // (ör. etkinlik detayından geri dönüş). Ağır liste yeniden render'ını
      // hemen başlatmak o animasyonla JS thread'i paylaşıyor ve bazı
      // cihaz/zamanlama koşullarında geçişi yarıda donuk bırakıyor — eski
      // ekranın alt kısmı yeni listenin üstünde kalıyor. Etkileşimler
      // (geçiş dahil) bitene kadar erteleyerek bu yarışı ortadan kaldırıyoruz.
      const task = InteractionManager.runAfterInteractions(() => {
        const isFirstLoad = !hasLoadedRef.current;
        hasLoadedRef.current = true;
        void fetchPage(isFirstLoad ? "initial" : "silent", queryRef.current, 1);
      });

      return () => task.cancel();
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

    if (!hasLoadedRef.current || queryRef.current.filters.sortBy === "time") {
      return;
    }

    void fetchPage("refresh", queryRef.current, 1);
  }, [fetchPage, originKey]);

  const refresh = useCallback(() => {
    void fetchPage("refresh", queryRef.current, 1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) {
      return;
    }
    void fetchPage("more", queryRef.current, page + 1);
  }, [fetchPage, hasNext, isLoadingMore, page]);

  const changeCategoryFilter = useCallback(
    (nextCategoryId: string | null) => {
      setCategoryFilter(nextCategoryId);
      void fetchPage(
        "initial",
        { ...queryRef.current, categoryId: nextCategoryId },
        1,
      );
    },
    [fetchPage],
  );

  const applyFilters = useCallback(
    (nextFilters: EventListFilters) => {
      setFilters(nextFilters);
      void fetchPage(
        "initial",
        { ...queryRef.current, filters: nextFilters },
        1,
      );
    },
    [fetchPage],
  );

  const changeScope = useCallback(
    (nextScope: EventFeedScope) => {
      const nextFilters = { ...queryRef.current.filters, organizationId: null };
      setScope(nextScope);
      setFilters(nextFilters);
      void fetchPage(
        "initial",
        { ...queryRef.current, filters: nextFilters, scope: nextScope },
        1,
      );
    },
    [fetchPage],
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
