import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useTranslation } from "react-i18next";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getEvents } from "@/features/events/services/events-service";
import type { EventSummary } from "@/features/events/types";

const PAGE_SIZE = 20;
/** API'nin kabul ettiği en büyük sayfa boyutu. */
const MAX_PAGE_SIZE = 100;
/** Odak tazelemesinde tek istekte yeniden alınabilecek en çok sayfa. */
const MAX_SILENT_PAGES = MAX_PAGE_SIZE / PAGE_SIZE;
export const DEFAULT_EVENT_FILTERS: EventListFilters = {
  city: null,
  minAge: 13,
  maxAge: 120,
  gender: null,
  skillLevel: null,
  isPaid: null,
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
  /** Tek bir spor branşı (filtre çekmecesinden seçilir). */
  sportId: string | null;
  /** "location": konuma göre yakından uzağa, "time": tarihe göre. */
  sortBy: EventSortBy;
};

export type EventFeedScope = "all" | "friends";

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
  const [filters, setFilters] = useState<EventListFilters>(DEFAULT_EVENT_FILTERS);
  const [error, setError] = useState<string | null>(null);
  /** Son "daha fazla" sayfası hata verdi; liste ve hasNext olduğu gibi kalır. */
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

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
  // "initial" isteği başka bir istek tarafından geçersiz kılınırsa, o istek
  // hata verdiğinde eski filtrenin etkinlikleri ekranda kalmasın diye tutulur.
  const pendingResetRef = useRef(false);
  // Başarıyla yüklenmiş sayfa sayısı; odak tazelemesi ("silent") listeyi
  // kısaltmamak için bu kadar sayfayı tek istekte yeniden alır.
  const pageRef = useRef(1);
  // Süren "more" isteği hâlâ en güncel istekse true: odak tazelemesi onu
  // geçersiz kılmasın diye atlanır.
  const moreInFlightRef = useRef(false);
  // Süren odak tazelemesi de "more" ile ezilmesin: detaydaki değişiklik
  // (katılım, iptal) kartlara yansımadan düşerdi. Bitince sayfa istenir.
  const silentInFlightRef = useRef(false);

  const fetchPage = useCallback(
    async (mode: FetchMode, query: EventQuery, nextPage: number) => {
      if (mode === "silent" && moreInFlightRef.current) return;

      const requestId = ++requestIdRef.current;
      // Bekleyen sıfırlama varken (eski filtrenin listesi güvenilmez) tek sayfa.
      const resetPending = pendingResetRef.current;
      const loadedPages = pageRef.current;
      const silentPages =
        mode === "silent" && !resetPending
          ? Math.min(loadedPages, MAX_SILENT_PAGES)
          : 1;
      // Yüklü sayfa sayısı sınırı aşıyorsa istek ilk 100 öğeyi alır, kuyruk korunur.
      const mergeTail =
        mode === "silent" && !resetPending && loadedPages > MAX_SILENT_PAGES;
      moreInFlightRef.current = mode === "more";
      silentInFlightRef.current = mode === "silent";
      if (mode === "initial") {
        pendingResetRef.current = true;
      }
      if (mode === "more" || mode === "initial" || mode === "refresh") {
        setLoadMoreFailed(false);
      }
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
          page: mode === "more" ? nextPage : 1,
          pageSize: silentPages * PAGE_SIZE,
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
        });
        if (!isLatest()) return;

        pendingResetRef.current = false;
        setError(null);
        setEvents((prev) => {
          if (mode === "more") {
            const known = new Set(prev.map((event) => event.id));
            return [
              ...prev,
              ...result.items.filter((event) => !known.has(event.id)),
            ];
          }
          if (mergeTail) {
            const fresh = new Set(result.items.map((event) => event.id));
            // Araya etkinlik girmiş/çıkmış olabilir: kuyruk, taze listenin son
            // öğesinin eski yerinden sonra başlar.
            const lastFreshId = result.items[result.items.length - 1]?.id;
            const tailIndex = prev.findIndex(
              (event) => event.id === lastFreshId,
            );
            const tailStart = tailIndex >= 0 ? tailIndex + 1 : MAX_PAGE_SIZE;
            return [
              ...result.items,
              ...prev.slice(tailStart).filter((event) => !fresh.has(event.id)),
            ];
          }
          return [...result.items];
        });
        setTotalCount(result.totalCount);
        if (mode === "silent") {
          setLoadMoreFailed(false);
          // Kuyruk korunuyorsa sayfa ve hasNext olduğu gibi kalır.
          if (!mergeTail) {
            pageRef.current = silentPages;
            setPage(silentPages);
            setHasNext(result.hasNext);
          }
        } else {
          pageRef.current = mode === "more" ? result.page : 1;
          setPage(pageRef.current);
          setHasNext(result.hasNext);
        }
      } catch (err) {
        if (!isLatest()) return;
        setError(getApiErrorMessage(err, t("loadFailed")));
        if (mode === "more") {
          setLoadMoreFailed(true);
        }
        if (mode === "silent") {
          // Tazeleme sürerken yok sayılan "liste sonu" yeniden denetlensin.
          setEvents((prev) => [...prev]);
        }
        if (pendingResetRef.current) {
          pendingResetRef.current = false;
          pageRef.current = 1;
          setPage(1);
          setEvents([]);
          setTotalCount(0);
          setHasNext(false);
        }
      } finally {
        // Yerini yenisine bırakan istek hiçbir göstergeyi kapatmaz; en güncel
        // istek bitince hepsi kapanır.
        if (isLatest()) {
          moreInFlightRef.current = false;
          silentInFlightRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
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
    if (
      !hasNext ||
      isLoadingMore ||
      isLoading ||
      isRefreshing ||
      loadMoreFailed ||
      silentInFlightRef.current
    ) {
      return;
    }
    void fetchPage("more", queryRef.current, page + 1);
  }, [
    fetchPage,
    hasNext,
    isLoadingMore,
    isLoading,
    isRefreshing,
    loadMoreFailed,
    page,
  ]);

  // Footer'daki dokunma/otomatik deneme: hata bayrağını yok sayar.
  const retryLoadMore = useCallback(() => {
    if (
      !hasNext ||
      isLoadingMore ||
      isLoading ||
      isRefreshing ||
      silentInFlightRef.current
    ) {
      return;
    }
    void fetchPage("more", queryRef.current, page + 1);
  }, [fetchPage, hasNext, isLoadingMore, isLoading, isRefreshing, page]);

  const reload = useCallback(() => {
    void fetchPage("initial", queryRef.current, 1);
  }, [fetchPage]);

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
      setScope(nextScope);
      void fetchPage("initial", { ...queryRef.current, scope: nextScope }, 1);
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
    loadMoreFailed,
    categoryFilter,
    setCategoryFilter: changeCategoryFilter,
    scope,
    setScope: changeScope,
    filters,
    applyFilters,
    refresh,
    loadMore,
    retryLoadMore,
    reload,
    error,
  };
}
