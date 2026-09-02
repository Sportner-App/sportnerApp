import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyOrganizations } from "@/services/organizations-service";
import type { ApiOrganizationListItem } from "@/types/organizations";

export function useMyOrganizations(enabled = true) {
  const [items, setItems] = useState<ApiOrganizationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const next = await listMyOrganizations();
      setItems(next);
      setError(null);
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        hasLoaded.current = false;
        setItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      void load(hasLoaded.current ? "refresh" : "initial").finally(() => {
        hasLoaded.current = true;
      });
    }, [enabled, load]),
  );

  return { items, isLoading, isRefreshing, error, refresh: () => load("refresh") };
}
