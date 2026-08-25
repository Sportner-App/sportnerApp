import { Redirect, Stack } from "expo-router";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth } from "@/contexts";
import { useFirstLaunch } from "@/contexts/first-launch-context";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function FirstLaunchLayout() {
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

  if (destination !== "first-launch") {
    return <Redirect href={STARTUP_HREF[destination]} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 220,
        contentStyle: { backgroundColor: "#0f172a" },
      }}
    />
  );
}
