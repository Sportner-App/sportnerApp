import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyOrganizedEvents,
  getMyParticipatingEvents,
} from "@/services/events-service";
import type { EventListPage, EventSummary } from "@/types/events";
import { hasEventStartedOrClosed } from "@/utils/events";

export type ActivityTab = "upcoming" | "past" | "organized";

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

function applyActivityScope(
  page: EventListPage,
  tab: Exclude<ActivityTab, "organized">,
): ListState {
  const items = page.items.filter((event) => {
    const past = hasEventStartedOrClosed(event);
    return tab === "past" ? past : !past;
  });

  return {
    items,
    page: page.page,
    hasNext: page.hasNext,
    totalCount: items.length,
  };
}

export function useActivity() {
  const [tab, setTab] = useState<ActivityTab>("upcoming");
  const [upcoming, setUpcoming] = useState<ListState>(EMPTY);
  const [past, setPast] = useState<ListState>(EMPTY);
  const [organized, setOrganized] = useState<ListState>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const [live, history, hosted] = await Promise.all([
        getMyParticipatingEvents(1, PAGE_SIZE, "upcoming"),
        getMyParticipatingEvents(1, PAGE_SIZE, "past"),
        getMyOrganizedEvents(1, PAGE_SIZE),
      ]);
      setUpcoming(applyActivityScope(live, "upcoming"));
      setPast(applyActivityScope(history, "past"));
      setOrganized(hosted);
    } catch (err) {
      setError(getApiErrorMessage(err, "Aktiviteler yüklenemedi."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const current =
    tab === "upcoming" ? upcoming : tab === "past" ? past : organized;

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
              tab === "upcoming" ? "upcoming" : "past",
            );

      const setter =
        tab === "upcoming"
          ? setUpcoming
          : tab === "past"
            ? setPast
            : setOrganized;

      const next =
        tab === "organized"
          ? result
          : applyActivityScope(result, tab);

      setter((prev) => ({
        items: [...prev.items, ...next.items],
        page: next.page,
        hasNext: next.hasNext,
        totalCount: prev.totalCount + next.items.length,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Daha fazla yüklenemedi."));
    } finally {
      setIsLoadingMore(false);
    }
  }, [current.hasNext, current.page, isLoadingMore, tab]);

  return {
    tab,
    setTab,
    events: current.items,
    totalCount: current.totalCount,
    hasNext: current.hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh: () => load("refresh"),
    loadMore,
  };
}
