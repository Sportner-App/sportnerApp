import { createContext, useContext } from "react";

import type { SessionContextValue } from "@/types/session";

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession SessionProvider içinde kullanılmalı.");
  }

  return context;
}
