import { Stack } from "expo-router";

import { StartupGate } from "@/features/auth/components/startup-gate";

export default function OnboardingLayout() {
  return (
    <StartupGate expect="profile-setup">
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </StartupGate>
  );
}
