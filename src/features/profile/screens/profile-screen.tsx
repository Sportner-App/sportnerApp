import { View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppText as Text,
  ErrorState,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { TabPage } from "@/features/app-shell/components/tab-page";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useProfileCopy, useProfileTabs } from "@/features/profile/copy";
import { useAppTour } from "@/contexts";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { listUserReviews } from "@/features/events/services/reviews-service";
import type { ApiReview } from "@/features/events/types";

import { OrganizationsSection } from "@/features/organizations/components/organizations-section";
import { MenuSection } from "@/features/profile/components/menu-section";
import { ProfileAboutSection } from "@/features/profile/components/profile-about-section";
import { ProfileHero } from "@/features/profile/components/profile-hero";
import { ReviewsSection } from "@/features/profile/components/reviews-section";
import { SportsSection } from "@/features/profile/components/sports-section";
import { StatsSection } from "@/features/profile/components/stats-section";

type ProfileTab = "activity" | "reviews" | "settings";

export function ProfileScreen() {
  const { t } = useTranslation(["profile", "common", "settings"]);
  const PROFILE_COPY = useProfileCopy();
  const PROFILE_TABS = useProfileTabs();
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
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");

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
    if (key === "logout") {
      void logout();
      return;
    }
    const routes: Record<string, string> = {
      edit: "/profile/edit",
      sports: "/profile/sports",
      friends: "/friends",
      feed: "/feed",
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
    <TabPage refreshing={isRefreshing} onRefresh={refresh}>
      {isLoading ? (
        <ScreenLoader label={t("profile:loading")} size={148} />
      ) : !profile ? (
        <ErrorState
          icon={notFound ? "user-slash" : "triangle-exclamation"}
          message={error ?? PROFILE_COPY.notFound}
          onRetry={refresh}
        />
      ) : (
        <>
          <ProfileHero
            profile={profile}
            onEdit={() => router.push("/profile/edit")}
          />
          <ProfileAboutSection
            bio={profile.bio}
            onFriendsPress={() => router.push("/friends")}
            onBadgesPress={() => router.push("/badges")}
          />
          <SportsSection
            profile={profile}
            onPress={() => router.push("/profile/sports")}
            onAdd={() => router.push("/profile/add-sport")}
          />
          <OrganizationsSection
            onPressList={() => router.push("/organizations")}
            onPressItem={(organizationId) =>
              router.push(`/organizations/${organizationId}`)
            }
          />
          <SegmentedTabs
            options={PROFILE_TABS}
            value={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "activity" ? (
            <StatsSection statistics={profile.statistics} />
          ) : null}

          {activeTab === "reviews" ? (
            <ReviewsSection
              reviews={reviews}
              isLoading={reviewsLoading}
              averageRating={
                profile.statistics?.averageRating ?? profile.averageRating
              }
              totalReviews={
                profile.statistics?.totalReviews ?? profile.reviewCount
              }
            />
          ) : null}

          {activeTab === "settings" ? (
            <MenuSection onItemPress={openMenu} isSigningOut={isSigningOut} />
          ) : null}
        </>
      )}
    </TabPage>
  );
}
