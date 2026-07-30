import { createContext, useContext } from "react";

export type SessionUser = {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  [key: string]: any;
};

export type SessionData = {
  access_token: string;
  user?: SessionUser;
};

export type SessionContextValue = {
  isConfigured: boolean;
  isReady: boolean;
  session: SessionData | null;
  user: SessionUser | null;
  refreshSession?: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession SessionProvider içinde kullanılmalı.");
  }

  return context;
}
