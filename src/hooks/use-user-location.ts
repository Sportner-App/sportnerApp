import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type UserLocationStatus =
  /** Henüz sorulmadı. */
  | "idle"
  /** İzin isteniyor ya da konum ölçülüyor. */
  | "loading"
  | "granted"
  /** Kullanıcı reddetti; iOS'ta ikinci kez sorulamaz, ayarlara gitmek gerekir. */
  | "denied"
  /** Konum servisleri kapalı veya cihaz konum veremedi. */
  | "unavailable";

/**
 * Son bilinen konum modül düzeyinde tutulur: kullanıcı sekmeler arasında
 * gezinirken her mount'ta yeniden GPS ölçümü beklemesin, liste ilk karede
 * doğru sırayla gelsin.
 */
let cachedCoordinates: UserCoordinates | null = null;

export function useUserLocation() {
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(
    cachedCoordinates,
  );
  const [status, setStatus] = useState<UserLocationStatus>(
    cachedCoordinates ? "granted" : "idle",
  );
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resolve = useCallback(async (canAskAgain: boolean) => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;

    try {
      if (mountedRef.current) {
        setStatus("loading");
      }

      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.status === Location.PermissionStatus.GRANTED;

      // Sistem penceresini yalnızca gerçekten sorulabildiğinde açıyoruz;
      // reddedilmiş bir izni tekrar istemek iOS'ta sessizce başarısız olur.
      if (!granted && (existing.canAskAgain || canAskAgain)) {
        const requested = await Location.requestForegroundPermissionsAsync();
        granted = requested.status === Location.PermissionStatus.GRANTED;
      }

      if (!granted) {
        if (mountedRef.current) {
          setStatus("denied");
        }
        return;
      }

      // Önce son bilinen konum: anında geliyor, listeyi bekletmiyor.
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && mountedRef.current) {
        cachedCoordinates = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
        setCoordinates(cachedCoordinates);
        setStatus("granted");
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      cachedCoordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      if (mountedRef.current) {
        setCoordinates(cachedCoordinates);
        setStatus("granted");
      }
    } catch {
      if (mountedRef.current) {
        // İzin var ama konum alınamadı (servis kapalı, sinyal yok).
        setStatus(cachedCoordinates ? "granted" : "unavailable");
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // İlk açılışta izni kendiliğinden sor; kullanıcı listeyi zaten doğru
  // sırada görmek istiyor, ayrıca bir düğmeye basmasına gerek olmasın.
  useEffect(() => {
    void resolve(true);
  }, [resolve]);

  /** Kullanıcı açıkça istediğinde: izin yoksa iste, reddedilmişse ayarlara götür. */
  const request = useCallback(async () => {
    const existing = await Location.getForegroundPermissionsAsync();

    if (
      existing.status !== Location.PermissionStatus.GRANTED &&
      !existing.canAskAgain
    ) {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
      return;
    }

    await resolve(true);
  }, [resolve]);

  return { coordinates, status, request };
}
