import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppTourOverlay, GlassTabBar } from "@/components";
import { AUTH_BYPASS } from "@/constants/env";
import { themeColors } from "@/constants/theme";
import { AppTourProvider, useAuth, useFirstLaunch } from "@/contexts";
import { getStartupDestination, STARTUP_HREF } from "@/utils/startup";

export default function TabsLayout() {
  const { t } = useTranslation("tabs");
  const { isReady, isAuthenticated, isOnboarded } = useAuth();
  const {
    isReady: isFirstLaunchReady,
    hasSeenOnboarding,
    isEnteringAuth,
  } = useFirstLaunch();

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

  if (destination !== "tabs") {
    return <Redirect href={STARTUP_HREF[destination]} />;
  }

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
