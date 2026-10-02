import { useCallback, useEffect, useState } from "react";

import { useRefreshableLoad } from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyOrganizations } from "@/features/organizations/services/organizations-service";
import type { ApiOrganizationListItem } from "@/features/organizations/types";

export function useMyOrganizations(enabled = true) {
  const [items, setItems] = useState<ApiOrganizationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listMyOrganizations());
      setError(null);
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    }
  }, []);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
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
