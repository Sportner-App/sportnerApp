import type { PropsWithChildren } from "react";

import { ToastProvider } from "@/shared/ui/toast-provider";

import { AuthProvider } from "./auth-provider";
import { NotificationProvider } from "./notification-provider";
import { SessionProvider } from "./session-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <SessionProvider>
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </SessionProvider>
    </ToastProvider>
  );
}
