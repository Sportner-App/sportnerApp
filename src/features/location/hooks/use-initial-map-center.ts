import * as Location from "expo-location";
import { useEffect, useState } from "react";

import { DEFAULT_EVENT_LOCATION } from "@/constants/map";
import { useUserLocation } from "@/features/location/hooks/use-user-location";
import type { GeoPoint } from "@/features/location/types";
import { useProfile } from "@/features/profile/hooks/use-profile";

/**
 * Haritanın ilk açılacağı nokta.
 *
 * Sıra kullanıcıya yakınlıktan uzağa: cihazın konumu, yoksa profildeki şehir,
 * o da yoksa varsayılan. Önceden her zaman varsayılan kullanılıyordu; Fethiye'de
 * oturan biri etkinliğini oluştururken haritayı İstanbul'da açıp elle
 * sürüklemek zorunda kalıyordu.
 *
 * Şehir adı cihazda çözülüyor (expo-location), ayrı bir servis çağrısı yok —
 * şehir listesinde koordinat tutulmuyor.
 */
export function useInitialMapCenter(): {
  center: GeoPoint;
  /** Cihazın konumu; haritada "buradasın" noktasını çizmek için. */
  userCoordinates: GeoPoint | null;
} {
  const { coordinates } = useUserLocation();
  const { profile } = useProfile();
  const [cityPoint, setCityPoint] = useState<GeoPoint | null>(null);

  const city = profile?.city ?? null;

  useEffect(() => {
    // Cihaz konumu varsa şehri çözmeye gerek yok: daha isabetli olan zaten o.
    if (coordinates || !city) {
      return;
    }

    let cancelled = false;

    void Location.geocodeAsync(`${city}, Türkiye`)
      .then((results) => {
        const first = results[0];
        if (!cancelled && first) {
          setCityPoint({
            latitude: first.latitude,
            longitude: first.longitude,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [city, coordinates]);

  return {
    center: coordinates ?? cityPoint ?? DEFAULT_EVENT_LOCATION,
    userCoordinates: coordinates,
  };
}
