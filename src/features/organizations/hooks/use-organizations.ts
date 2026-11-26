import { useCallback, useEffect, useRef, useState } from "react";

import {
  useRefreshableLoad,
  type LoadMode,
} from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyOrganizations } from "@/features/organizations/services/organizations-service";
import type { ApiOrganizationListItem } from "@/features/organizations/types";

export function useMyOrganizations(enabled = true) {
  const [items, setItems] = useState<ApiOrganizationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async (mode: LoadMode) => {
    try {
      setItems(await listMyOrganizations());
      setError(null);
    } catch (reason) {
      // Sessiz tazelemede dolu liste varken hata yazılmaz.
      if (mode === "silent" && itemsRef.current.length > 0) return;
      setError(getApiErrorMessage(reason));
    }
  }, []);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
    refocusMode: "silent",
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setError(null);
    }
  }, [enabled]);

  return { items, isLoading, isRefreshing, error, refresh };
}
