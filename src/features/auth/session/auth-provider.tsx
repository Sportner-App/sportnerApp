import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { useAuthActions } from "@/features/auth/hooks/use-auth-actions";
import type { AuthContextValue } from "@/features/auth/types";

import { AuthContext } from "./auth-context";
import { useSession } from "./session-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const { isReady, session, user } = useSession();
  const actions = useAuthActions();

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(user?.id),
      isEmailVerified: Boolean(user?.isEmailVerified),
      isOnboarded: Boolean(user?.isOnboarded),
      session,
      user,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      accessToken: session?.access_token ?? null,
      refreshToken: session?.refresh_token ?? null,
      ...actions,
    }),
    [actions, isReady, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
