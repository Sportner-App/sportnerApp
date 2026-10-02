import type { PropsWithChildren } from "react";

import { AuthProvider } from "@/features/auth/session/auth-provider";
import { FirstLaunchProvider } from "@/features/first-launch/first-launch-provider";
import { LanguageSyncBridge } from "./language-sync-bridge";
import { PendingAttendancePrompt } from "@/features/events/components/pending-attendance-prompt";
import { PushNotificationsProvider } from "@/features/notifications/push-notifications-provider";
import { SessionProvider } from "@/features/auth/session/session-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <FirstLaunchProvider>
        <SessionProvider>
          <AuthProvider>
            <LanguageSyncBridge>
              <PushNotificationsProvider>
                <PendingAttendancePrompt>{children}</PendingAttendancePrompt>
              </PushNotificationsProvider>
            </LanguageSyncBridge>
          </AuthProvider>
        </SessionProvider>
      </FirstLaunchProvider>
    </ToastProvider>
  );
}

export { AuthContext, useAuth } from "@/features/auth/session/auth-context";
export {
  FirstLaunchContext,
  useFirstLaunch,
} from "@/features/first-launch/first-launch-context";
export {
  SessionContext,
  useSession,
} from "@/features/auth/session/session-context";
export { useToast } from "./toast-provider";
export { AppTourProvider, useAppTour } from "./app-tour-context";
export {
  ThemePreferenceProvider,
  useThemePreference,
} from "./theme-preference-provider";
export {
  LanguagePreferenceProvider,
  useLanguagePreference,
} from "./language-preference-provider";
