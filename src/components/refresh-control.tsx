import { RefreshControl } from "react-native";

import type { BrandRefreshControlProps } from "@/types/components";

/**
 * Sadece pull-to-refresh jestini sağlar.
 * `refreshing` her zaman false: native spinner hiç çizilmez.
 * Görsel feedback LinearRefreshBar'dadır.
 */
export function BrandRefreshControl({
  refreshing,
  onRefresh,
}: BrandRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={false}
      onRefresh={onRefresh}
      enabled={!refreshing}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
    />
  );
}
