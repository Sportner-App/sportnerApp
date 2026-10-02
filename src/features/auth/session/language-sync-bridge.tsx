import { type PropsWithChildren, useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/session/auth-context";
import { useLanguagePreference } from "@/contexts/language-preference-provider";

/**
 * `LanguagePreferenceProvider` (cihaz/app dili, sadece local) `AuthProvider`'ın
 * üstünde mount edildiği için oradan `useAuth()` çağrılamıyor — bu köprü
 * ikisinin de erişilebildiği bir noktada, dil değiştikçe backend'deki
 * `User.PreferredLanguage`'ı senkron tutar (bkz. syncPreferredLanguage).
 */
export function LanguageSyncBridge({ children }: PropsWithChildren) {
  const { isAuthenticated, syncPreferredLanguage } = useAuth();
  const { resolvedLanguage } = useLanguagePreference();
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedRef.current = null;
      return;
    }

    if (lastSyncedRef.current === resolvedLanguage) {
      return;
    }

    lastSyncedRef.current = resolvedLanguage;
    void syncPreferredLanguage(resolvedLanguage);
  }, [isAuthenticated, resolvedLanguage, syncPreferredLanguage]);

  return <>{children}</>;
}
