import { Redirect, Stack } from "expo-router";

import { useAuth, useFirstLaunch } from "@/contexts";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function AuthLayout() {
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

  if (destination !== "auth") {
    return <Redirect href={STARTUP_HREF[destination]} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
