import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppText as Text,
  BottomSheet,
  Button,
  LoadMoreFooter,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { ProfileAboutSection } from "@/features/profile/components/profile-about-section";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { ProfileHero } from "@/features/profile/components/profile-hero";
import {
  PostsGridPlaceholder,
  PostsGridRowView,
  useUserPosts,
  type PostsGridRow,
} from "@/features/profile/components/posts-grid";
import {
  TabListPage,
} from "@/features/app-shell/components/tab-list-page";
import { ReviewsSection } from "@/features/profile/components/reviews-section";
import { SportsSection } from "@/features/profile/components/sports-section";
import { ChallengeMedals } from "@/features/challenges/components/challenge-medals";
import { DistrictCrowns } from "@/features/leaderboards/components/district-crowns";
import { StatsSection } from "@/features/profile/components/stats-section";
import { createDirectConversation } from "@/features/messaging/services/messaging-service";
import { getPublicProfile } from "@/features/profile/services/profile-service";
import { listUserReviews } from "@/features/events/services/reviews-service";
import {
  acceptFriendRequest,
  blockUser,
  rejectFriendRequest,
  removeFriendship,
  resolveFriendshipWith,
  sameUserId,
  sendFriendRequest,
  toProfileFriendship,
} from "@/features/social/services/social-service";
import type {
  ApiProfileFriendship,
  UserProfile,
} from "@/features/profile/types";
import type { ApiReview } from "@/features/events/types";
import { FRIENDSHIP_STATUS } from "@/features/social/types";
import { errorNotification, successNotification } from "@/utils/haptics";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";

type FriendAction =
  "send" | "accept" | "reject" | "remove" | "block" | "message" | null;
type ProfileTab = "posts" | "activity" | "sports";

export function PublicProfileScreen() {
  const { t } = useTranslation("users");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [friendAction, setFriendAction] = useState<FriendAction>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Menü kapandıktan sonra açılacak onay sayfası: iki sheet aynı anda açık
  // kalmasın diye menünün kapanma animasyonu bitince açılıyor.
  const afterMenu = useRef<"block" | "report" | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const profileTabs = useMemo(
    () => [
      {
        key: "posts" as const,
        icon: "table-cells" as const,
        label: t("publicProfile.tabs.posts"),
      },
      {
        key: "activity" as const,
        icon: "chart-simple" as const,
        label: t("publicProfile.tabs.activity"),
      },
      {
        key: "sports" as const,
        icon: "medal" as const,
        label: t("publicProfile.tabs.sports"),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!id) {
      return;
    }
    void getPublicProfile(id)
      .then(async (next) => {
        const friendship = isAuthenticated
          ? (next.friendship ??
            (await resolveFriendshipWith(next.userId).catch(() => null)))
          : null;
        setProfile({ ...next, friendship });
        setReviewsLoading(true);
        return listUserReviews(next.userId)
          .then((page) => setReviews(page?.items ?? []))
          .catch(() => setReviews([]))
          .finally(() => setReviewsLoading(false));
      })
      .catch((error) =>
        showToast({
          type: "error",
          title: t("publicProfile.toasts.notFoundTitle"),
          description: getApiErrorMessage(error),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated, showToast, t]);

  const isMe = Boolean(
    user?.id && profile && sameUserId(user.id, profile.userId),
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
  const friendship = profile?.friendship ?? null;
  const status = friendship?.status ?? null;
  const isIncomingPending =
    status === FRIENDSHIP_STATUS.pending &&
    sameUserId(friendship?.addresseeUserId, user?.id);
  const isOutgoingPending =
    status === FRIENDSHIP_STATUS.pending &&
    sameUserId(friendship?.requesterUserId, user?.id);
  const isAccepted = status === FRIENDSHIP_STATUS.accepted;
  const isBlocked = status === FRIENDSHIP_STATUS.blocked;

  const setFriendship = (next: ApiProfileFriendship | null) => {
    setProfile((current) =>
      current ? { ...current, friendship: next } : current,
    );
  };

  const handleSend = async () => {
    if (!requireAuth(t("publicProfile.auth.sendFriendRequest"))) return;
    if (!profile) {
      return;
    }

    setFriendAction("send");
    try {
      const created = await sendFriendRequest(profile.userId);
      setFriendship(
        toProfileFriendship(created) ?? {
          friendshipId: created?.id ?? "",
          status: FRIENDSHIP_STATUS.pending,
          requesterUserId: user?.id ?? "",
          addresseeUserId: profile.userId,
        },
      );
      successNotification();
      showToast({
        type: "success",
        title: t("publicProfile.toasts.requestSentTitle"),
      });
    } catch (error) {
      const existing =
        isApiError(error) && error.status === 409
          ? await resolveFriendshipWith(profile.userId, {
              includeAccepted: true,
            }).catch(() => null)
          : null;

      if (existing) {
        setFriendship(existing);
        return;
      }

      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.sendFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  const handleAccept = async () => {
    if (!friendship) {
      return;
    }

    setFriendAction("accept");
    try {
      const accepted = await acceptFriendRequest(friendship.friendshipId);
      setFriendship(
        toProfileFriendship(accepted) ?? {
          ...friendship,
          status: FRIENDSHIP_STATUS.accepted,
        },
      );
      successNotification();
      showToast({
        type: "success",
        title: t("publicProfile.toasts.friendAddedTitle"),
      });
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.acceptFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  const handleReject = async () => {
    if (!friendship) {
      return;
    }

    setFriendAction("reject");
    try {
      await rejectFriendRequest(friendship.friendshipId);
      setFriendship(null);
      showToast({
        type: "success",
        title: t("publicProfile.toasts.requestDeclinedTitle"),
      });
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.rejectFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  const handleMessage = async () => {
    if (!profile || friendAction === "message") {
      return;
    }

    setFriendAction("message");
    try {
      const conversation = await createDirectConversation(profile.userId);
      router.push(`/conversations/${conversation.id}`);
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.chatFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  const handleRemove = async () => {
    if (!friendship || friendAction === "remove") {
      return;
    }

    setFriendAction("remove");
    try {
      await removeFriendship(friendship.friendshipId);
      setFriendship(null);
      setRemoveConfirmOpen(false);
      showToast({
        type: "success",
        title: t("publicProfile.toasts.removedTitle"),
      });
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.removeFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  const handleBlock = async () => {
    if (!profile || friendAction === "block") {
      return;
    }

    setFriendAction("block");
    try {
      await blockUser(profile.userId);
      successNotification();
      setBlockConfirmOpen(false);
      showToast({
        type: "success",
        title: t("publicProfile.toasts.blockedTitle"),
      });
      router.back();
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: t("publicProfile.toasts.blockFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

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
            isOwnProfile={isMe}
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
      screenHeader={
        <ScreenHeader
          title={t("publicProfile.title")}
          showBack
          right={
            profile && !isMe ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("publicProfile.menu.a11y")}
                hitSlop={HIT_SLOP}
                onPress={() => setMenuOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
              >
                <FontAwesome6
                  name="ellipsis"
                  size={15}
                  color={themeColors.text.secondary}
                />
              </Pressable>
            ) : undefined
          }
        />
      }
      header={
        <>
          {isLoading ? (
            <ScreenLoader label={t("publicProfile.loading")} size={140} />
          ) : !profile ? (
            <Text className="text-center font-body text-body-sm text-text-tertiary">
              {t("publicProfile.notFound")}
            </Text>
          ) : (
            <>
              <ProfileHero
                profile={profile}
                onPostsPress={() => setActiveTab("posts")}
              />
              <ProfileAboutSection bio={profile.bio} />
              <View className="gap-2">
                {isIncomingPending ? (
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        label={t("publicProfile.actions.accept")}
                        size="sm"
                        isLoading={friendAction === "accept"}
                        disabled={friendAction === "reject"}
                        onPress={() => void handleAccept()}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label={t("publicProfile.actions.reject")}
                        variant="dangerOutline"
                        size="sm"
                        isLoading={friendAction === "reject"}
                        disabled={friendAction === "accept"}
                        onPress={() => void handleReject()}
                      />
                    </View>
                  </View>
                ) : null}

                {!isMe ? (
                  <View className="flex-row gap-2">
                    {!isIncomingPending && !isBlocked ? (
                      <View className="flex-1">
                        {isAccepted ? (
                          <Button
                            label={t("publicProfile.actions.message")}
                            size="sm"
                            isLoading={friendAction === "message"}
                            disabled={
                              friendAction !== null &&
                              friendAction !== "message"
                            }
                            onPress={() => void handleMessage()}
                          />
                        ) : isOutgoingPending ? (
                          <Button
                            label={t("publicProfile.actions.requestSent")}
                            variant="secondary"
                            size="sm"
                            disabled
                          />
                        ) : (
                          <Button
                            label={t("publicProfile.actions.addFriend")}
                            size="sm"
                            isLoading={friendAction === "send"}
                            onPress={() => void handleSend()}
                          />
                        )}
                      </View>
                    ) : null}
                    {isAccepted ? (
                      <View className="flex-1">
                        <Button
                          label={t("publicProfile.actions.removeFriend")}
                          variant="dangerOutline"
                          size="sm"
                          disabled={friendAction !== null}
                          onPress={() => setRemoveConfirmOpen(true)}
                        />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <ProfileTabs
                options={profileTabs}
                value={activeTab}
                onChange={setActiveTab}
              />

              {activeTab === "activity" ? (
                <>
                  <StatsSection statistics={profile.statistics} />
                  <ChallengeMedals userId={profile.userId} />
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
                <SportsSection profile={profile} />
              ) : null}

              <BottomSheet
                visible={menuOpen}
                onClose={() => setMenuOpen(false)}
                onClosed={() => {
                  const next = afterMenu.current;
                  afterMenu.current = null;
                  if (next === "block") {
                    setBlockConfirmOpen(true);
                  } else if (next === "report") {
                    router.push({
                      pathname: "/report",
                      params: { entityType: "0", entityId: profile.userId },
                    });
                  }
                }}
                title={profile.fullName}
              >
                <View className="gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (!requireAuth(t("publicProfile.auth.reportUser"))) {
                        setMenuOpen(false);
                        return;
                      }
                      afterMenu.current = "report";
                      setMenuOpen(false);
                    }}
                    className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-4 active:bg-surface-secondary"
                  >
                    <FontAwesome6
                      name="flag"
                      size={16}
                      color={themeColors.text.secondary}
                    />
                    <Text className="flex-1 font-body text-body text-text-primary">
                      {t("publicProfile.actions.report")}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: friendAction === "block" }}
                    disabled={friendAction === "block"}
                    onPress={() => {
                      afterMenu.current = "block";
                      setMenuOpen(false);
                    }}
                    className="flex-row items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-4 active:opacity-70"
                  >
                    <FontAwesome6
                      name="ban"
                      size={16}
                      color={themeColors.destructive}
                    />
                    <Text className="flex-1 font-body text-body text-destructive">
                      {t("publicProfile.actions.block")}
                    </Text>
                  </Pressable>
                </View>
              </BottomSheet>

              <BottomSheet
                visible={blockConfirmOpen}
                onClose={() => {
                  if (friendAction !== "block") {
                    setBlockConfirmOpen(false);
                  }
                }}
                title={t("publicProfile.blockSheet.title")}
                subtitle={t("publicProfile.blockSheet.subtitle")}
                showCancel={false}
                footer={
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        label={t("common:cancel")}
                        variant="dangerOutline"
                        disabled={friendAction === "block"}
                        onPress={() => setBlockConfirmOpen(false)}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label={t("publicProfile.blockSheet.confirm")}
                        variant="danger"
                        isLoading={friendAction === "block"}
                        disabled={friendAction === "block"}
                        onPress={() => void handleBlock()}
                      />
                    </View>
                  </View>
                }
              />

              <BottomSheet
                visible={removeConfirmOpen}
                onClose={() => {
                  if (friendAction !== "remove") {
                    setRemoveConfirmOpen(false);
                  }
                }}
                title={t("publicProfile.removeFriendSheet.title")}
                subtitle={t("publicProfile.removeFriendSheet.subtitle")}
                showCancel={false}
                footer={
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        label={t("common:cancel")}
                        variant="dangerOutline"
                        disabled={friendAction === "remove"}
                        onPress={() => setRemoveConfirmOpen(false)}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label={t("publicProfile.removeFriendSheet.confirm")}
                        variant="danger"
                        isLoading={friendAction === "remove"}
                        disabled={friendAction === "remove"}
                        onPress={() => void handleRemove()}
                      />
                    </View>
                  </View>
                }
              />
            </>
          )}
        </>
      }
    />
  );
}
