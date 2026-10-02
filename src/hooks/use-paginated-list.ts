import { useCallback, useEffect, useRef, useState } from "react";

export type PaginatedMode = "initial" | "refresh" | "more";

/** `cursor` imleç (string) ya da sayfa numarası olabilir; null = son sayfa. */
export type FetchedPage<T, C> = {
  items: T[];
  nextCursor: C | null;
  /** Sayfa numaralı API'lerde toplam kayıt sayısı. */
  totalCount?: number;
};

type Options<T> = {
  /** Hata akışı çağıranda: toast, error state vb. */
  onError?: (error: unknown, mode: PaginatedMode) => void;
  /** Verilirse "daha fazla" sayfasında zaten listede olan öğeler atlanır. */
  getKey?: (item: T) => string;
};

/**
 * Sonsuz kaydırmalı listelerin ortak döngüsü. `fetchPage` useCallback ile
 * sabitlenmeli; değiştiğinde (ör. sekme/arama değişimi) liste ilk sayfadan
 * yeniden yüklenir. Eski isteklerin yanıtları yok sayılır.
 */
export function usePaginatedList<T, C>(
  fetchPage: (cursor: C | null) => Promise<FetchedPage<T, C>>,
  { onError, getKey }: Options<T> = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<C | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const latestModeRef = useRef<PaginatedMode>("initial");

  // Callback'ler her render'da yeni olabilir; yeniden yüklemeyi tetiklemesinler.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const getKeyRef = useRef(getKey);
  getKeyRef.current = getKey;

  const run = useCallback(
    async (mode: PaginatedMode, cursor: C | null) => {
      const requestId = ++requestIdRef.current;
      latestModeRef.current = mode;
      const setFlag =
        mode === "initial"
          ? setIsLoading
          : mode === "refresh"
            ? setIsRefreshing
            : setIsLoadingMore;
      setFlag(true);

      try {
        const page = await fetchPage(cursor);
        if (requestId !== requestIdRef.current) return;

        setItems((current) => {
          if (mode !== "more") return page.items;
          const keyOf = getKeyRef.current;
          if (!keyOf) return [...current, ...page.items];
          const known = new Set(current.map(keyOf));
          return [
            ...current,
            ...page.items.filter((item) => !known.has(keyOf(item))),
          ];
        });
        setNextCursor(page.nextCursor);
        if (page.totalCount !== undefined) setTotalCount(page.totalCount);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        onErrorRef.current?.(error, mode);
      } finally {
        // Aynı türden daha yeni bir istek sürüyorsa bayrağı o kapatır.
        if (
          requestId === requestIdRef.current ||
          latestModeRef.current !== mode
        ) {
          setFlag(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    setNextCursor(null);
    void run("initial", null);
  }, [run]);

  const refresh = useCallback(() => run("refresh", null), [run]);
  const reload = useCallback(() => run("initial", null), [run]);

  const loadMore = useCallback(() => {
    if (nextCursor === null || isLoading || isRefreshing || isLoadingMore) {
      return;
    }
    void run("more", nextCursor);
  }, [isLoading, isLoadingMore, isRefreshing, nextCursor, run]);

  return {
    items,
    setItems,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: nextCursor !== null,
    totalCount,
    refresh,
    reload,
    loadMore,
  };
}
