import { Platform, RefreshControl } from "react-native";

import type { BrandRefreshControlProps } from "@/types/components";

export function BrandRefreshControl({
  refreshing,
  onRefresh,
}: BrandRefreshControlProps) {
  if (Platform.OS === "android") {
    return undefined;
  }
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
}
