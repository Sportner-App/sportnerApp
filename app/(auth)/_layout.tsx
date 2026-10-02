import { Stack } from "expo-router";

import { StartupGate } from "@/features/auth/components/startup-gate";

export default function AuthLayout() {
  return (
    <StartupGate expect="auth">
      <Stack screenOptions={{ headerShown: false }} />
    </StartupGate>
  );
}
