import { Redirect, Stack } from "expo-router";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useFirstLaunch } from "@/contexts";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function AuthLayout() {
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

  if (destination !== "auth") {
    return <Redirect href={STARTUP_HREF[destination]} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
