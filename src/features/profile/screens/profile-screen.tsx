import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorState, LoadMoreFooter, ScreenLoader } from "@/components";
import {
  TabListPage,
} from "@/features/app-shell/components/tab-list-page";
import { ChallengeMedals } from "@/features/challenges/components/challenge-medals";
import { listUserReviews } from "@/features/events/services/reviews-service";
import type { ApiReview } from "@/features/events/types";
import { DistrictCrowns } from "@/features/leaderboards/components/district-crowns";
import { OrganizationsSection } from "@/features/organizations/components/organizations-section";
import {
  PostsGridPlaceholder,
  PostsGridRowView,
  useUserPosts,
  type PostsGridRow,
} from "@/features/profile/components/posts-grid";
import { ProfileAboutSection } from "@/features/profile/components/profile-about-section";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { ProfileHero } from "@/features/profile/components/profile-hero";
import { ReportCardReadyBanner } from "@/features/profile/components/report-card-ready-banner";
import { ReviewsSection } from "@/features/profile/components/reviews-section";
import { SportsSection } from "@/features/profile/components/sports-section";
import { StatsSection } from "@/features/profile/components/stats-section";
import { useProfileCopy, useProfileTabs } from "@/features/profile/copy";
import { useProfile } from "@/features/profile/hooks/use-profile";
import {
  consumePendingProfileTab,
  type ProfileTab,
} from "@/features/profile/pending-tab";

export function ProfileScreen() {
  const { t } = useTranslation("profile");
  const PROFILE_COPY = useProfileCopy();
  const PROFILE_TABS = useProfileTabs();
  const router = useRouter();
  const { profile, isLoading, isRefreshing, error, notFound, refresh } =
    useProfile();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  // Bildirimden gelen sekme isteği. Ekran zaten açıkken gelen bildirim de
  // çalışsın diye her odaklanmada okunuyor; istek tek seferlik tüketiliyor.
  useFocusEffect(
    useCallback(() => {
      const requested = consumePendingProfileTab();
      if (requested) {
        setActiveTab(requested);
      }
    }, []),
  );

  const posts = useUserPosts(profile?.userId);
  const showPosts = activeTab === "posts" && Boolean(profile);
  const lastRowKey = posts.rows[posts.rows.length - 1]?.key;
  const renderRow = useCallback(
    ({ item }: { item: PostsGridRow }) => (
      // Izgara kenardan kenara; sayfanın yatay boşluğu uygulanmaz.
      <PostsGridRowView row={item} isLast={item.key === lastRowKey} />
    ),
    [lastRowKey],
  );

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

  return (
    <TabListPage
      data={showPosts && !posts.isLoading ? posts.rows : []}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      itemGap={0}
      // ProfileTabs -mb-2 ile 8 pt yukarı çekiyor; 8 bunu sıfırlar, ızgara sekme çizgisine yapışır.
      listTopGap={8}
      onEndReached={showPosts ? posts.loadMore : undefined}
      empty={
        showPosts ? (
          <PostsGridPlaceholder
            isLoading={posts.isLoading}
            failed={posts.failed}
            isOwnProfile
          />
        ) : null
      }
      footer={
        showPosts ? (
          <LoadMoreFooter
            isLoading={posts.isLoadingMore}
            failed={posts.loadMoreFailed}
            onRetry={posts.retryLoadMore}
          />
        ) : null
      }
      refreshing={isRefreshing}
      onRefresh={refresh}
      headerAction={{
        icon: "gear",
        label: t("hero.settingsAccessibility"),
        onPress: () => router.push("/profile/settings"),
        replacesSearch: true,
      }}
      header={
        <>
          {isLoading ? (
            <ScreenLoader label={t("loading")} size={148} />
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
                onPostsPress={() => setActiveTab("posts")}
                onFriendsPress={() => router.push("/friends")}
                onBadgesPress={() => router.push("/badges")}
              />
              <ProfileAboutSection bio={profile.bio} />
              <ReportCardReadyBanner userId={profile.userId} />

              <ProfileTabs
                options={PROFILE_TABS}
                value={activeTab}
                onChange={setActiveTab}
              />

              {activeTab === "activity" ? (
                <>
                  <StatsSection statistics={profile.statistics} interactive />
                  <ChallengeMedals userId={profile.userId} linkToChallenges />
                  <DistrictCrowns userId={profile.userId} />
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
                </>
              ) : null}

              {activeTab === "sports" ? (
                <SportsSection
                  profile={profile}
                  onPress={() => router.push("/profile/sports")}
                  onAdd={() => router.push("/profile/add-sport")}
                />
              ) : null}

              {activeTab === "groups" ? (
                <OrganizationsSection
                  onPressList={() =>
                    router.push({
                      pathname: "/(tabs)/discover",
                      // ts: aynı parametrelerle ikinci gelişte de sekme açılsın.
                      params: {
                        mode: "clubs",
                        scope: "mine",
                        ts: String(Date.now()),
                      },
                    })
                  }
                  onPressItem={(organizationId) =>
                    router.push(`/clubs/${organizationId}`)
                  }
                />
              ) : null}
            </>
          )}
        </>
      }
    />
  );
}
