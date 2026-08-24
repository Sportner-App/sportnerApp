import { Redirect, Tabs } from "expo-router";

import { GlassTabBar } from "@/components";
import { AUTH_BYPASS } from "@/constants/env";
import { useAuth } from "@/contexts";

export default function TabsLayout() {
  const { isReady, isAuthenticated, isOnboarded } = useAuth();

  // Session hazır olmadan home mount olmasın (çift sports/events fetch).
  if (!isReady) {
    return null;
  }

  if (!AUTH_BYPASS && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!AUTH_BYPASS && !isOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#0f172a" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="discover" options={{ title: "Keşfet" }} />
      <Tabs.Screen name="activity" options={{ title: "Aktivite" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
