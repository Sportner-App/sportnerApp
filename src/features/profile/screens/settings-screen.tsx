import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppScreen, ScreenHeader } from "@/components";
import { requestAppTour } from "@/contexts";
import { MenuSection } from "@/features/profile/components/menu-section";
import { useProfile } from "@/features/profile/hooks/use-profile";

/** Profilin sağ üstündeki çarktan açılan ayarlar listesi. */
export function SettingsScreen() {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const { isSigningOut, logout } = useProfile();

  const openMenu = (key: string) => {
    if (key === "app-tour") {
      router.navigate("/(tabs)" as never);
      setTimeout(requestAppTour, 250);
      return;
    }
    if (key === "logout") {
      void logout();
      return;
    }
    const routes: Record<string, string> = {
      edit: "/profile/edit",
      sports: "/profile/sports",
      friends: "/friends",
      badges: "/badges",
      notifications: "/notifications",
      "notification-settings": "/notifications/settings",
      privacy: "/profile/privacy",
      feedback: "/feedback",
      help: "/help",
    };
    const href = routes[key];
    if (href) {
      router.push(href as never);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("tabs.settings")} showBack />}
      contentClassName="gap-6 px-5 pt-3"
    >
      <MenuSection onItemPress={openMenu} isSigningOut={isSigningOut} />
    </AppScreen>
  );
}
