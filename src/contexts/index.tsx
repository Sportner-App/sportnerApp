import type { PropsWithChildren } from "react";

import { AuthProvider } from "./auth-provider";
import { FirstLaunchProvider } from "./first-launch-provider";
import { PushNotificationsProvider } from "./push-notifications-provider";
import { SessionProvider } from "./session-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <FirstLaunchProvider>
        <SessionProvider>
          <AuthProvider>
            <PushNotificationsProvider>{children}</PushNotificationsProvider>
          </AuthProvider>
        </SessionProvider>
      </FirstLaunchProvider>
    </ToastProvider>
  );
}

export { AuthContext, useAuth } from "./auth-context";
export { FirstLaunchContext, useFirstLaunch } from "./first-launch-context";
export { SessionContext, useSession } from "./session-context";
export { useToast } from "./toast-provider";
