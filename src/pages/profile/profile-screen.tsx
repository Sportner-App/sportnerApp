import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useRouter } from "expo-router";

import { PROFILE_COPY } from "@/constants/profile";
import { useProfile } from "@/hooks/use-profile";

import { MenuSection } from "./menu-section";
import { ProfileHero } from "./profile-hero";
import { SportsSection } from "./sports-section";
import { StatsSection } from "./stats-section";

export function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    isRefreshing,
    isSigningOut,
    error,
    notFound,
    refresh,
    logout,
  } = useProfile();

  const openMenu = (key: string) => {
    const routes: Record<string, string> = {
      edit: "/profile/edit",
      sports: "/profile/sports",
      friends: "/friends",
      feed: "/feed",
      badges: "/badges",
      albums: "/albums",
      notifications: "/notifications",
      "notification-settings": "/profile/notification-settings",
      privacy: "/profile/privacy",
      help: "/help",
    };
    const href = routes[key];
    if (href) {
      router.push(href as never);
    }
  };

  return (
    <AppScreen
      withTabBar
      header={<ScreenHeader title={PROFILE_COPY.header} />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-5 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Profil yükleniyor" />
        </View>
      ) : !profile ? (
        <View className="items-center gap-4 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-16">
          <FontAwesome6
            name={notFound ? "user-slash" : "triangle-exclamation"}
            size={24}
            color="#64748b"
          />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {error ?? PROFILE_COPY.notFound}
          </Text>
          <Button
            label="Tekrar Dene"
            variant="outline"
            size="sm"
            onPress={refresh}
          />
        </View>
      ) : (
        <>
          <ProfileHero profile={profile} />
          <StatsSection statistics={profile.statistics} />
          <SportsSection
            profile={profile}
            onPress={() => router.push("/profile/sports")}
          />
          <MenuSection
            onItemPress={openMenu}
            onLogout={logout}
            isSigningOut={isSigningOut}
          />
        </>
      )}
    </AppScreen>
  );
}
