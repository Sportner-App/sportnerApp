import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiClient } from "@/lib/api/client";
import { getSession } from "@/services/auth-service";
import type { SessionContextValue, SessionData } from "@/types/session";

import { SessionContext } from "./session-context";

function getSessionKey(session: SessionData | null) {
  return session ? JSON.stringify(session) : null;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const sessionKeyRef = useRef<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await getSession();
      const nextSession = data.session ?? null;
      const nextKey = getSessionKey(nextSession);

      if (nextKey === sessionKeyRef.current) {
        return;
      }

      sessionKeyRef.current = nextKey;
      setSession(nextSession);
    } catch (error) {
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

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      isConfigured: true,
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
