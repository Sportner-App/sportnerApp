import { Redirect } from "expo-router";

import { useAuth, useFirstLaunch } from "@/contexts";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function Index() {
  const { isReady, isAuthenticated, isEmailVerified, isOnboarded } = useAuth();
  const { isReady: isFirstLaunchReady, hasSeenOnboarding, isEnteringAuth } =
    useFirstLaunch();

  if (!isReady || !isFirstLaunchReady) {
    return null;
  }

  const destination = getStartupDestination({
    isAuthenticated,
    isEmailVerified,
    isOnboarded,
    hasSeenOnboarding,
    isEnteringAuth,
  });

  return <Redirect href={STARTUP_HREF[destination]} />;
}
