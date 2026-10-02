import { Stack } from "expo-router";

import { StartupGate } from "@/features/auth/components/startup-gate";

export default function FirstLaunchLayout() {
  return (
    <StartupGate expect="first-launch">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 220,
          contentStyle: { backgroundColor: "#06111a" },
        }}
      />
    </StartupGate>
  );
}
