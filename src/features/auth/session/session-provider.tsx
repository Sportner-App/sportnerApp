import type { PropsWithChildren } from "react";
import { AppState } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiClient } from "@/lib/api/client";
import { getSession } from "@/features/auth/services/auth-service";
import type { SessionContextValue, SessionData } from "@/features/auth/types";

import { SessionContext } from "./session-context";

function getSessionKey(session: SessionData | null) {
  return session ? JSON.stringify(session) : null;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const sessionKeyRef = useRef<string | null>(null);
  /** Token'lar okunamadıysa (kilitli Keychain) uygulama öne gelince yeniden yükle */
  const pendingReloadRef = useRef(false);
  /** Eş zamanlı yüklemelerde eski sonuç yenisini (ör. çıkışı) ezmesin */
  const loadIdRef = useRef(0);

  const loadSession = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    try {
      const { data, unreadable } = await getSession();
      if (loadId !== loadIdRef.current) return;

      if (unreadable) {
        // Oturum yok sayma: mevcut state'e dokunma, aktif olunca tekrar dene.
        pendingReloadRef.current = true;
        return;
      }
      pendingReloadRef.current = false;

      const nextSession = data.session ?? null;
      const nextKey = getSessionKey(nextSession);

      if (nextKey === sessionKeyRef.current) {
        return;
      }

      sessionKeyRef.current = nextKey;
      setSession(nextSession);
    } catch (error) {
      if (loadId !== loadIdRef.current) return;
      console.error("Session load error:", error);
      sessionKeyRef.current = null;
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Sadece AsyncStorage'dan oku — refresh yalnızca 401'de (api client).
    void (async () => {
      try {
        if (isMounted) {
          await loadSession();
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    })();

    const unsubscribe = apiClient.subscribeToAuthChanges(() => {
      void loadSession();
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active" && pendingReloadRef.current) {
          void loadSession();
        }
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [loadSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      isReady,
      session,
      user: session?.user ?? null,
      refreshSession: loadSession,
    }),
    [isReady, session, loadSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
