import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { useSession } from "@/entities/session";
import {
  AuthContext,
  type AuthContextValue,
} from "@/features/auth/model/auth-context";
import { useAuthActions } from "@/features/auth/model/use-auth-actions";

export function AuthProvider({ children }: PropsWithChildren) {
  const { isConfigured, isReady, session, user } = useSession();
  const actions = useAuthActions();

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      isReady,
      isAuthenticated: Boolean(user?.id),
      session,
      user,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      accessToken: session?.access_token ?? null,
      refreshToken: null,
      ...actions,
    }),
    [actions, isConfigured, isReady, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
