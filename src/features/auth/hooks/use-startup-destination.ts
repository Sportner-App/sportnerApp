import { useAuth, useFirstLaunch } from "@/contexts";
import {
  getStartupDestination,
  type StartupDestination,
} from "@/features/auth/startup";

/** Oturum ve ilk açılış durumu hazır olana kadar null. */
export function useStartupDestination(): StartupDestination | null {
  const { isReady, isAuthenticated, isEmailVerified, isOnboarded } = useAuth();
  const {
    isReady: isFirstLaunchReady,
    hasSeenOnboarding,
    isEnteringAuth,
  } = useFirstLaunch();

  if (!isReady || !isFirstLaunchReady) {
    return null;
  }

  return getStartupDestination({
    isAuthenticated,
    isEmailVerified,
    isOnboarded,
    hasSeenOnboarding,
    isEnteringAuth,
  });
}
