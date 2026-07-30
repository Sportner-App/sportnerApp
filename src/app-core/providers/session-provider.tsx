import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SessionContext,
  type SessionContextValue,
  type SessionData,
} from "@/entities/session";
import { getSession } from "@/features/auth/api/auth-service";

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await getSession();
      setSession(data.session ?? null);
    } catch (error) {
      console.error("Session load error:", error);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Saklanan session'ı kontrol et
    void loadSession().then(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    // Login/logout olduğunda session'ı refresh et
    // 500ms interval ile session'ı kontrol et
    const intervalId = setInterval(() => {
      void loadSession();
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
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
