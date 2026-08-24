import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { useAuthActions } from "@/hooks/use-auth-actions";
import type { AuthContextValue } from "@/types/auth";

import { AuthContext } from "./auth-context";
import { useSession } from "./session-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const { isConfigured, isReady, session, user } = useSession();
  const actions = useAuthActions();

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      isReady,
      isAuthenticated: Boolean(user?.id),
      isOnboarded: Boolean(user?.isOnboarded),
      session,
      user,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      accessToken: session?.access_token ?? null,
      refreshToken: session?.refresh_token ?? null,
      ...actions,
    }),
    [actions, isConfigured, isReady, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
