import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

import i18n from "@/i18n";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyOrganizedEvents,
  getMyParticipatingEvents,
} from "@/services/events-service";
import type { EventListPage, EventSummary } from "@/types/events";
import {
  hasApprovedParticipation,
  hasEventEnded,
  hasEventInvitation,
  hasPendingParticipation,
} from "@/utils/events";

export type ActivityTab = "upcoming" | "past" | "pending" | "organized";

const PAGE_SIZE = 20;

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

export function useActivity() {
  const [tab, setTab] = useState<ActivityTab>("upcoming");
  const [upcoming, setUpcoming] = useState<ListState>(EMPTY);
  const [past, setPast] = useState<ListState>(EMPTY);
  const [pending, setPending] = useState<ListState>(EMPTY);
  const [organized, setOrganized] = useState<ListState>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else if (mode === "refresh") {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const [live, history, hosted] = await Promise.all([
        getMyParticipatingEvents(1, PAGE_SIZE, "upcoming"),
        getMyParticipatingEvents(1, PAGE_SIZE, "past"),
        getMyOrganizedEvents(1, PAGE_SIZE),
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
        page: live.page,
        hasNext: live.hasNext,
        totalCount: upcomingItems.length,
      });
      setPending({
        items: pendingItems,
        page: live.page,
        hasNext: live.hasNext,
        totalCount: pendingItems.length,
      });
      setPast({
        items: pastItems,
        page: history.page,
        hasNext: history.hasNext,
        totalCount: pastItems.length,
      });
      setOrganized(hosted);
    } catch (err) {
      setError(getApiErrorMessage(err, i18n.t("activity:errors.loadFailed")));
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else if (mode === "refresh") {
        setIsRefreshing(false);
      }
    }
  }, []);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current ? "silent" : "initial").finally(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

  const current =
    tab === "upcoming"
      ? upcoming
      : tab === "past"
        ? past
        : tab === "pending"
          ? pending
          : organized;

  const loadMore = useCallback(async () => {
    if (!current.hasNext || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextPage = current.page + 1;
      const result =
        tab === "organized"
          ? await getMyOrganizedEvents(nextPage, PAGE_SIZE)
          : await getMyParticipatingEvents(
              nextPage,
              PAGE_SIZE,
              tab === "past" ? "past" : "upcoming",
            );

      const next =
        tab === "organized"
          ? {
              items: result.items,
              page: result.page,
              hasNext: result.hasNext,
              totalCount: result.items.length,
            }
          : filterPage(
              result,
              tab === "past"
                ? (event) => hasEventEnded(event)
                : tab === "pending"
                  ? isAwaitingResponse
                  : isConfirmedActive,
            );

      if (tab === "organized") {
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
        tab === "past"
          ? setPast
          : tab === "pending"
            ? setPending
            : tab === "organized"
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
      setError(
        getApiErrorMessage(err, i18n.t("activity:errors.loadMoreFailed")),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [current.hasNext, current.page, isLoadingMore, tab]);

  return {
    tab,
    setTab,
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
    error,
    refresh: () => load("refresh"),
    loadMore,
  };
}
