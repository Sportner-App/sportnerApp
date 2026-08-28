import { RefreshControl } from "react-native";

import type { BrandRefreshControlProps } from "@/types/components";

/**
 * Sadece pull-to-refresh jestini sağlar.
 * Native spinner şeffaftır; görsel feedback LinearRefreshBar'dadır.
 * Gerçek `refreshing` değeri native yaşam döngüsünü açık tutar.
 */
export function BrandRefreshControl({
  refreshing,
  onRefresh,
}: BrandRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
    />
  );
}
