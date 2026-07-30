import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { EventFeedItem, EventFilter } from "@/entities/event";
import { apiClient } from "@/shared/api/client";

type UseEventsFeedResult = {
  events: EventFeedItem[];
  filteredEvents: EventFeedItem[];
  filters: EventFilter[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  locationMessage: string;
  isUsingNearbySort: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const LOCATION_TIMEOUT_MS = 9000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Konum alma zaman aşımına uğradı."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function useEventsFeed(): UseEventsFeedResult {
  const router = useRouter();
  const [events, setEvents] = useState<EventFeedItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [isUsingNearbySort, setIsUsingNearbySort] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const isRefreshingRequest = options?.refreshing ?? false;

      if (isRefreshingRequest) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        let eventsList: EventFeedItem[] = [];
        let usedNearbySort = false;

        // Konum izni iste
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status === "granted") {
          try {
            const position = await withTimeout(
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                mayShowUserSettingsDialog: true,
              }),
              LOCATION_TIMEOUT_MS,
            );
            console.log("selam");
            const response = await apiClient.get<EventFeedItem[]>(
              "/api/events/nearby",
              {
                params: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              },
            );
            console.log(response, "resss");
            eventsList = Array.isArray(response.data) ? response.data : [];
            usedNearbySort = true;
            setLocationMessage("");
          } catch {
            setLocationMessage(
              "Konum alınamadı. Etkinlikler tarihe göre listelendi.",
            );

            try {
              const response = await apiClient.get<EventFeedItem[]>(
                "/api/events",
                {
                  params: {
                    sortBy: "date",
                  },
                },
              );

              eventsList = Array.isArray(response.data) ? response.data : [];
            } catch (fallbackError: any) {
              if (fallbackError?.response?.status === 401) {
                router.replace("/(auth)/login");
                return;
              }

              throw new Error(
                fallbackError?.response?.data?.message ||
                  fallbackError?.message ||
                  "Etkinlikler yüklenemedi.",
              );
            }
          }
        } else {
          setLocationMessage(
            "Konum izni verilmedi. Etkinlikler tarihe göre listelendi.",
          );

          try {
            const response = await apiClient.get<EventFeedItem[]>(
              "/api/events",
              {
                params: {
                  sortBy: "date",
                },
              },
            );

            eventsList = Array.isArray(response.data) ? response.data : [];
          } catch (fallbackError: any) {
            if (fallbackError?.response?.status === 401) {
              router.replace("/(auth)/login");
              return;
            }

            throw new Error(
              fallbackError?.response?.data?.message ||
                fallbackError?.message ||
                "Etkinlikler yüklenemedi.",
            );
          }
        }
        console.log(eventsList, "eventlist");
        setEvents(eventsList);
        setIsUsingNearbySort(usedNearbySort);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Etkinlikler yüklenemedi.";

        setError(message);
        setEvents([]);
        setIsUsingNearbySort(false);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const filters = useMemo(() => {
    const sportMap = new Map<string, string>();

    events.forEach((event) => {
      const filterKey = event.sportType ?? event.sport_type ?? "";
      const label = event.sports?.name ?? filterKey;

      if (!sportMap.has(filterKey)) {
        sportMap.set(filterKey, label);
      }
    });

    return [
      { key: "all", label: "All" },
      ...Array.from(sportMap.entries()).map(([key, label]) => ({ key, label })),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedFilter === "all") {
      return events;
    }

    return events.filter(
      (event) => (event.sportType ?? event.sport_type) === selectedFilter,
    );
  }, [events, selectedFilter]);

  return {
    events,
    filteredEvents,
    filters,
    selectedFilter,
    setSelectedFilter,
    isLoading,
    isRefreshing,
    locationMessage,
    isUsingNearbySort,
    error,
    refresh: async () => fetchEvents({ refreshing: true }),
  };
}
