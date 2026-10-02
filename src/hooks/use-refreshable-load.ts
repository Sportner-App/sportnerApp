import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * - `initial`: tam ekran yükleniyor durumu (`isLoading`)
 * - `refresh`: çekerek yenileme göstergesi (`isRefreshing`)
 * - `silent`: gösterge yok, veri arka planda tazelenir
 */
export type LoadMode = "initial" | "refresh" | "silent";

type Options = {
  /** `mount`: bileşen açılınca bir kez; `focus`: ekran her odaklandığında. */
  trigger?: "mount" | "focus";
  /** Odak tetiklemesinde ilk yüklemeden sonraki odaklar hangi modda çalışsın. */
  refocusMode?: LoadMode;
  /** false iken yükleme yapılmaz; tekrar true olunca yeniden "initial" sayılır. */
  enabled?: boolean;
  /** Değiştiğinde (ör. route id) bir sonraki yükleme yeniden "initial" sayılır. */
  resetKey?: unknown;
};

/**
 * Ekranların tekrar tekrar yazdığı yükleme döngüsü: initial/refresh
 * bayrakları ve "ilk odakta yükle, sonrakilerde yenile" mantığı.
 * Veri ve hata state'i çağıranda kalır; `load` kendi try/catch'ini yapar.
 * `load` useCallback ile sabitlenmeli — değiştiğinde yeniden tetiklenir.
 */
export function useRefreshableLoad(
  load: (mode: LoadMode) => Promise<void>,
  {
    trigger = "mount",
    refocusMode = "refresh",
    enabled = true,
    resetKey,
  }: Options = {},
) {
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const lastResetKey = useRef(resetKey);

  const run = useCallback(
    async (mode: LoadMode) => {
      if (mode === "initial") setIsLoading(true);
      else if (mode === "refresh") setIsRefreshing(true);
      try {
        await load(mode);
      } finally {
        if (mode === "initial") setIsLoading(false);
        else if (mode === "refresh") setIsRefreshing(false);
        hasLoaded.current = true;
      }
    },
    [load],
  );

  const runAutomatic = useCallback(() => {
    if (!enabled) {
      hasLoaded.current = false;
      setIsLoading(false);
      return;
    }
    if (lastResetKey.current !== resetKey) {
      lastResetKey.current = resetKey;
      hasLoaded.current = false;
    }
    void run(hasLoaded.current ? refocusMode : "initial");
  }, [enabled, refocusMode, resetKey, run]);

  useFocusEffect(
    useCallback(() => {
      if (trigger === "focus") runAutomatic();
    }, [runAutomatic, trigger]),
  );

  useEffect(() => {
    if (trigger === "mount") {
      hasLoaded.current = false;
      runAutomatic();
    }
  }, [runAutomatic, trigger]);

  const refresh = useCallback(() => run("refresh"), [run]);

  return { isLoading, isRefreshing, refresh, reload: run };
}
