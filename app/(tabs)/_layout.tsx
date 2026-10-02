import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppTourOverlay } from "@/features/app-shell/components/app-tour-overlay";
import { GlassTabBar } from "@/features/app-shell/components/glass-tab-bar";
import { themeColors } from "@/constants/theme";
import { AppTourProvider, useAuth } from "@/contexts";
import { StartupGate } from "@/features/auth/components/startup-gate";

export default function TabsLayout() {
  return (
    <StartupGate expect="tabs">
      <TabsNavigator />
    </StartupGate>
  );
}

function TabsNavigator() {
  const { t } = useTranslation("tabs");
  const { isAuthenticated } = useAuth();

  return (
    <AppTourProvider autoStart={isAuthenticated}>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "#06111a" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("events"),
            sceneStyle: { backgroundColor: themeColors.background.primary },
          }}
        />
        <Tabs.Screen name="discover" options={{ title: t("discover") }} />
        <Tabs.Screen name="activity" options={{ title: t("activity") }} />
        <Tabs.Screen name="profile" options={{ title: t("profile") }} />
      </Tabs>
      <AppTourOverlay />
    </AppTourProvider>
  );
}
