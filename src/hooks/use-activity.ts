import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyOrganizedEvents,
  getMyParticipatingEvents,
} from "@/services/events-service";
import type { EventSummary } from "@/types/events";

export type ActivityTab = "participating" | "organized";

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

export function useActivity() {
  const [tab, setTab] = useState<ActivityTab>("participating");
  const [participating, setParticipating] = useState<ListState>(EMPTY);
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
      const [joined, hosted] = await Promise.all([
        getMyParticipatingEvents(1, PAGE_SIZE),
        getMyOrganizedEvents(1, PAGE_SIZE),
      ]);
      setParticipating(joined);
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

  const current = tab === "participating" ? participating : organized;

  const loadMore = useCallback(async () => {
    if (!current.hasNext || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextPage = current.page + 1;
      const result =
        tab === "participating"
          ? await getMyParticipatingEvents(nextPage, PAGE_SIZE)
          : await getMyOrganizedEvents(nextPage, PAGE_SIZE);

      const setter = tab === "participating" ? setParticipating : setOrganized;
      setter((prev) => ({
        items: [...prev.items, ...result.items],
        page: result.page,
        hasNext: result.hasNext,
        totalCount: result.totalCount,
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
