import { useCallback, useDeferredValue, useRef, useState } from "react";

import i18n from "@/i18n";
import { useRefreshableLoad, type LoadMode } from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyOrganizedEvents,
  getMyParticipatingEvents,
} from "@/features/events/services/events-service";
import type { EventListPage, EventSummary } from "@/features/events/types";
import {
  hasApprovedParticipation,
  hasEventEnded,
  hasEventInvitation,
  hasPendingParticipation,
} from "@/features/events/status";

export type ActivityTab = "upcoming" | "past" | "pending" | "organized";

const PAGE_SIZE = 20;
/** Odak tazelemesinde bir liste için yeniden alınabilecek en çok sayfa (100 kayıt). */
const MAX_SILENT_PAGES = 5;

type ListState = {
  items: EventSummary[];
  page: number;
  hasNext: boolean;
  totalCount: number;
};

const EMPTY: ListState = {
  items: [],
  page: 1,
  hasNext: false,
  totalCount: 0,
};

function uniqueEvents(items: EventSummary[]): EventSummary[] {
  return Array.from(new Map(items.map((event) => [event.id, event])).values());
}

function sortUpcoming(items: EventSummary[]): EventSummary[] {
  return [...items].sort(
    (left, right) =>
      new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
  );
}

function filterPage(
  page: EventListPage,
  predicate: (event: EventSummary) => boolean,
): ListState {
  const items = page.items.filter(predicate);
  return {
    items,
    page: page.page,
    hasNext: page.hasNext,
    totalCount: items.length,
  };
}

function isAwaitingResponse(event: EventSummary): boolean {
  return (
    !hasEventEnded(event) &&
    (hasPendingParticipation(event.myParticipationStatus) ||
      hasEventInvitation(event.myParticipationStatus))
  );
}

function isConfirmedActive(event: EventSummary): boolean {
  return (
    !hasEventEnded(event) &&
    hasApprovedParticipation(event.myParticipationStatus)
  );
}

export function useActivity(initialTab: ActivityTab = "upcoming") {
  const [tab, setTab] = useState<ActivityTab>(initialTab);
  const [upcoming, setUpcoming] = useState<ListState>(EMPTY);
  const [past, setPast] = useState<ListState>(EMPTY);
  const [pending, setPending] = useState<ListState>(EMPTY);
  const [organized, setOrganized] = useState<ListState>(EMPTY);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hata, hangi sekmenin sayfasında olduysa onunla birlikte tutulur; başka
  // sekmede failed göstermesin.
  const [failedTab, setFailedTab] = useState<ActivityTab | null>(null);

  // Yüklenmiş sayfa sayıları (silent tazeleme listeyi kısaltmasın diye).
  // Ref'ten okunur: `load` sabit kalmalı, yoksa odakta yeniden tetiklenir.
  const pagesRef = useRef({ live: 1, history: 1, hosted: 1 });

  const load = useCallback(async (mode: LoadMode = "initial") => {
    try {
      setError(null);
      const silent = mode === "silent";
      const pageCount = (loaded: number) =>
        silent ? Math.min(Math.max(loaded, 1), MAX_SILENT_PAGES) : 1;
      const liveCount = pageCount(pagesRef.current.live);
      const historyCount = pageCount(pagesRef.current.history);
      const hostedCount = pageCount(pagesRef.current.hosted);
      const [live, history, hosted] = await Promise.all([
        getMyParticipatingEvents(1, liveCount * PAGE_SIZE, "upcoming"),
        getMyParticipatingEvents(1, historyCount * PAGE_SIZE, "past"),
        getMyOrganizedEvents(1, hostedCount * PAGE_SIZE),
      ]);

      // Backend scope'ları tarih bazlı daraltabilse de gerçek sekme kararı etkinliğin
      // bitiş zamanı ve kullanıcının katılım durumuyla verilir.
      const participatingItems = uniqueEvents([
        ...live.items,
        ...history.items,
      ]);
      const hostedActive = hosted.items.filter(
        (event) => !hasEventEnded(event),
      );
      const upcomingItems = sortUpcoming(
        uniqueEvents([
          ...participatingItems.filter(isConfirmedActive),
          ...hostedActive,
        ]),
      );
      const pendingItems = sortUpcoming(
        participatingItems.filter(isAwaitingResponse),
      );
      const pastItems = uniqueEvents([
        ...participatingItems.filter((event) => hasEventEnded(event)),
        ...hosted.items.filter((event) => hasEventEnded(event)),
      ]).sort(
        (left, right) =>
          new Date(right.eventDate).getTime() -
          new Date(left.eventDate).getTime(),
      );

      setUpcoming({
        items: upcomingItems,
        page: liveCount,
        hasNext: live.hasNext,
        totalCount: upcomingItems.length,
      });
      setPending({
        items: pendingItems,
        page: liveCount,
        hasNext: live.hasNext,
        totalCount: pendingItems.length,
      });
      setPast({
        items: pastItems,
        page: historyCount,
        hasNext: history.hasNext,
        totalCount: pastItems.length,
      });
      setOrganized({ ...hosted, page: hostedCount });
      setFailedTab(null);
    } catch (err) {
      setError(getApiErrorMessage(err, i18n.t("activity:errors.loadFailed")));
    }
  }, []);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
    refocusMode: "silent",
  });

  // Seçili sekme (SegmentedTabs ve rozetler) acil güncellenir; listenin
  // gösterdiği sekme ikinci planda render edilir. Böylece kartların yeniden
  // çizimi dokunuşu bekletmez. Liste verisi ve loadMore'un istek attığı
  // sekme hep ertelenmiş sekmeden hesaplanır: erteleme sürerken yanlış
  // sekmeye sayfa eklenmesin.
  const listTab = useDeferredValue(tab);

  const current =
    listTab === "upcoming"
      ? upcoming
      : listTab === "past"
        ? past
        : listTab === "pending"
          ? pending
          : organized;

  pagesRef.current = {
    live: Math.max(upcoming.page, pending.page),
    history: past.page,
    hosted: organized.page,
  };

  const fetchMore = useCallback(async () => {
    if (!current.hasNext || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setFailedTab(null);
    try {
      const nextPage = current.page + 1;
      const result =
        listTab === "organized"
          ? await getMyOrganizedEvents(nextPage, PAGE_SIZE)
          : await getMyParticipatingEvents(
              nextPage,
              PAGE_SIZE,
              listTab === "past" ? "past" : "upcoming",
            );

      const next =
        listTab === "organized"
          ? {
              items: result.items,
              page: result.page,
              hasNext: result.hasNext,
              totalCount: result.items.length,
            }
          : filterPage(
              result,
              listTab === "past"
                ? (event) => hasEventEnded(event)
                : listTab === "pending"
                  ? isAwaitingResponse
                  : isConfirmedActive,
            );

      if (listTab === "organized") {
        const hostedPast = result.items.filter((event) => hasEventEnded(event));
        if (hostedPast.length > 0) {
          setPast((prev) => {
            const items = uniqueEvents([...prev.items, ...hostedPast]).sort(
              (left, right) =>
                new Date(right.eventDate).getTime() -
                new Date(left.eventDate).getTime(),
            );
            return { ...prev, items, totalCount: items.length };
          });
        }
      }

      const setter =
        listTab === "past"
          ? setPast
          : listTab === "pending"
            ? setPending
            : listTab === "organized"
              ? setOrganized
              : setUpcoming;

      setter((prev) => {
        const items = uniqueEvents([...prev.items, ...next.items]);
        return {
          items,
          page: next.page,
          hasNext: next.hasNext,
          totalCount: items.length,
        };
      });
    } catch (err) {
      setFailedTab(listTab);
      setError(
        getApiErrorMessage(err, i18n.t("activity:errors.loadMoreFailed")),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [current.hasNext, current.page, isLoadingMore, listTab]);

  // Kaydırmayla çağrılan; hata varken sessiz kalır (footer dener).
  const loadMore = useCallback(() => {
    if (failedTab === listTab) {
      return;
    }
    void fetchMore();
  }, [failedTab, fetchMore, listTab]);

  const retryLoadMore = useCallback(() => {
    void fetchMore();
  }, [fetchMore]);

  return {
    tab,
    setTab,
    listTab,
    events: current.items,
    totalCount: current.totalCount,
    tabCounts: {
      upcoming: upcoming.totalCount,
      pending: pending.totalCount,
      past: past.totalCount,
      organized: organized.totalCount,
    },
    hasNext: current.hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    loadMoreFailed: failedTab === listTab,
    error,
    refresh,
    loadMore,
    retryLoadMore,
  };
}
