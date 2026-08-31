import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

import { Button, SportLoader, TabPage } from "@/components";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { PROFILE_COPY } from "@/constants/profile";
import { useAppTour } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { listUserReviews } from "@/services/reviews-service";
import type { ApiReview } from "@/types/reviews";

import { OrganizationsSection } from "../organizations/organizations-section";
import { MenuSection } from "./menu-section";
import { ProfileHero } from "./profile-hero";
import { ReviewsSection } from "./reviews-section";
import { SportsSection } from "./sports-section";
import { StatsSection } from "./stats-section";

export function ProfileScreen() {
  const router = useRouter();
  const { startTour } = useAppTour();
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
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.userId) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    void listUserReviews(profile.userId)
      .then((page) => setReviews(page?.items ?? []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [profile?.userId, isRefreshing]);

  const openMenu = (key: string) => {
    if (key === "app-tour") {
      router.navigate("/(tabs)" as never);
      setTimeout(startTour, 250);
      return;
    }
    const routes: Record<string, string> = {
      edit: "/profile/edit",
      sports: "/profile/sports",
      friends: "/friends",
      feed: "/feed",
      badges: "/badges",
      notifications: "/notifications",
      "notification-settings": "/profile/notification-settings",
      appearance: "/profile/appearance",
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
    <TabPage refreshing={isRefreshing} onRefresh={refresh}>
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Profil yükleniyor" />
        </View>
      ) : !profile ? (
        <View className="items-center gap-4 rounded-3xl border border-border-default bg-surface-primary px-6 py-16">
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
          <ProfileHero
            profile={profile}
            onEdit={() => router.push("/profile/edit")}
          />
          <StatsSection statistics={profile.statistics} />
          <OrganizationsSection
            onPressList={() => router.push("/organizations")}
            onPressItem={(organizationId) =>
              router.push(`/organizations/${organizationId}`)
            }
          />
          <SportsSection
            profile={profile}
            onPress={() => router.push("/profile/sports")}
          />
          <ReviewsSection reviews={reviews} isLoading={reviewsLoading} />
          <MenuSection
            onItemPress={openMenu}
            onLogout={logout}
            isSigningOut={isSigningOut}
          />
        </>
      )}
    </TabPage>
  );
}
