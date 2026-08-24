import type { PropsWithChildren } from "react";

import { AuthProvider } from "./auth-provider";
import { SessionProvider } from "./session-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <SessionProvider>
        <AuthProvider>{children}</AuthProvider>
      </SessionProvider>
    </ToastProvider>
  );
}

export { AuthContext, useAuth } from "./auth-context";
export { SessionContext, useSession } from "./session-context";
export { useToast } from "./toast-provider";
