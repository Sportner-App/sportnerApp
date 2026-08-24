import { useCallback, useEffect, useRef, useState } from "react";

import { SPORT_FILTERS } from "@/constants/events";
import { getApiErrorMessage } from "@/lib/api/errors";
import { exploreEvents, explorePeople } from "@/services/events-service";
import { listSports } from "@/services/sports-service";
import type { ExploreEventItem, ExplorePerson } from "@/types/events";
import type { Sport } from "@/types/sports";

export type DiscoverTab = "events" | "people";

export function useDiscover() {
  const [tab, setTab] = useState<DiscoverTab>("events");
  const [city, setCity] = useState("");
  const [sportSlug, setSportSlug] = useState("all");
  const [events, setEvents] = useState<ExploreEventItem[]>([]);
  const [people, setPeople] = useState<ExplorePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sportsRef = useRef<Sport[]>([]);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        setError(null);
        if (sportsRef.current.length === 0) {
          sportsRef.current = await listSports();
        }

        const resolvedSportId =
          sportSlug === "all"
            ? undefined
            : sportsRef.current.find((sport) => sport.slug === sportSlug)?.id;

        const cityParam = city.trim() || undefined;
        const [nextEvents, nextPeople] = await Promise.all([
          exploreEvents({
            sportId: resolvedSportId,
            city: cityParam,
            limit: 30,
          }),
          explorePeople({
            sportId: resolvedSportId,
            city: cityParam,
            limit: 30,
          }),
        ]);
        setEvents(nextEvents);
        setPeople(nextPeople);
      } catch (err) {
        setError(getApiErrorMessage(err, "Keşfet yüklenemedi."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [city, sportSlug],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  return {
    tab,
    setTab,
    city,
    setCity,
    sportSlug,
    setSportSlug,
    sportFilters: SPORT_FILTERS,
    events,
    people,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load("refresh"),
  };
}
