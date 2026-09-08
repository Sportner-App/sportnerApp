import type { ReactElement } from "react";
import { Platform, RefreshControl, type RefreshControlProps } from "react-native";

import type { BrandRefreshControlProps } from "@/types/components";

/**
 * Sadece pull-to-refresh jestini sağlar.
 * Native spinner şeffaftır; görsel feedback LinearRefreshBar'dadır.
 * Gerçek `refreshing` değeri native yaşam döngüsünü açık tutar.
 *
 * Android'de RefreshControl (SwipeRefreshLayoutManager), Fabric ile
 * ScrollView içeriğinin hiç render edilmemesine (tam boş ekran) yol açan
 * bir native prop-setter hatası veriyor ("Could not find generated setter
 * for class ...SwipeRefreshLayoutManager"). Kalıcı üst seviye bir çökme
 * olmadığı için Android'de bu native bileşeni hiç mount etmiyoruz; görsel
 * "yenileniyor" geri bildirimi LinearRefreshBar üzerinden devam ediyor.
 *
 * Bileşen değil fonksiyon olmasının nedeni: Android'de ScrollView, dolu bir
 * `refreshControl` prop'u gördüğünde kendini `cloneElement` ile o elementin
 * çocuğu yapıyor. İçi boş render eden bir bileşen bu çocuğu düşürüp tüm
 * sayfa içeriğini yok ediyor; prop'un baştan `undefined` olması gerekiyor.
 */
export function brandRefreshControl({
  refreshing,
  onRefresh,
}: BrandRefreshControlProps): ReactElement<RefreshControlProps> | undefined {
  if (Platform.OS === "android") {
    return undefined;
  }
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
}
