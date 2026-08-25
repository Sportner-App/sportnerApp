import { Redirect } from "expo-router";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useFirstLaunch } from "@/contexts";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function Index() {
  const { isReady, isAuthenticated, isOnboarded } = useAuth();
  const { isReady: isFirstLaunchReady, hasSeenOnboarding, isEnteringAuth } =
    useFirstLaunch();

  if (!isReady || !isFirstLaunchReady) {
    return null;
  }

  const destination = getStartupDestination({
    authBypass: AUTH_BYPASS,
    isAuthenticated,
    isOnboarded,
    hasSeenOnboarding,
    isEnteringAuth,
  });

  return <Redirect href={STARTUP_HREF[destination]} />;
}
