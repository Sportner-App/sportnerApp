import { Stack } from "expo-router";

import { StartupGate } from "@/features/auth/components/startup-gate";

export default function VerifyEmailLayout() {
  return (
    <StartupGate expect="verify-email">
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </StartupGate>
  );
}
