import { createContext, useContext } from "react";

import type { useAuthActions } from "@/features/auth/model/use-auth-actions";
import { type SessionUser, type SessionData } from "@/entities/session";

type AuthActions = ReturnType<typeof useAuthActions>;

export type AuthContextValue = AuthActions & {
  isConfigured: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  session: SessionData | null;
  user: SessionUser | null;
  userId: string | null;
  userEmail: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth AuthProvider içinde kullanılmalı.");
  }

  return context;
}
