import { Redirect } from "expo-router";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth } from "@/contexts";

export default function Index() {
  const { isReady, isAuthenticated, isOnboarded } = useAuth();

  if (AUTH_BYPASS) {
    return <Redirect href="/(tabs)" />;
  }

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
