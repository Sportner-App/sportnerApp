import { Redirect, Stack } from "expo-router";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth } from "@/contexts";

export default function OnboardingLayout() {
  const { isReady, isAuthenticated, isOnboarded } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!AUTH_BYPASS && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!AUTH_BYPASS && isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
  );
}
