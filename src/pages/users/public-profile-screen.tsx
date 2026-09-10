import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  BottomSheet,
  Button,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { ProfileAboutSection } from "@/pages/profile/profile-about-section";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { ProfileHero } from "@/pages/profile/profile-hero";
import { ReviewsSection } from "@/pages/profile/reviews-section";
import { SportsSection } from "@/pages/profile/sports-section";
import { StatsSection } from "@/pages/profile/stats-section";
import { createDirectConversation } from "@/services/messaging-service";
import { getPublicProfile } from "@/services/profile-service";
import { listUserReviews } from "@/services/reviews-service";
import {
  acceptFriendRequest,
  blockUser,
  rejectFriendRequest,
  resolveFriendshipWith,
  sameUserId,
  sendFriendRequest,
  toProfileFriendship,
} from "@/services/social-service";
import type { ApiProfileFriendship, UserProfile } from "@/types/profile";
import type { ApiReview } from "@/types/reviews";
import { FRIENDSHIP_STATUS } from "@/types/social";
import { errorNotification, successNotification } from "@/utils/haptics";
import { useRequireAuth } from "@/hooks/use-require-auth";

type FriendAction = "send" | "accept" | "reject" | "block" | "message" | null;
type ProfileTab = "activity" | "reviews";

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
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");

  const profileTabs = useMemo(
    () => [
      { key: "activity" as const, label: t("publicProfile.tabs.activity") },
      { key: "reviews" as const, label: t("publicProfile.tabs.reviews") },
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
    <AppScreen
      header={<ScreenHeader title={t("publicProfile.title")} showBack />}
      contentClassName="gap-6 px-5 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={140} label={t("publicProfile.loading")} />
        </View>
      ) : !profile ? (
        <Text className="text-center font-body text-sm text-brand-neutral">
          {t("publicProfile.notFound")}
        </Text>
      ) : (
        <>
          <ProfileHero profile={profile} />
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
                    variant="outline"
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
                          friendAction !== null && friendAction !== "message"
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
              </View>
            ) : null}
          </View>

          <SportsSection profile={profile} />
          <SegmentedTabs
            options={profileTabs}
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

          {!isMe ? (
            <View className="gap-2">
              <Button
                label={t("publicProfile.actions.report")}
                variant="outline"
                size="sm"
                onPress={() => {
                  if (!requireAuth(t("publicProfile.auth.reportUser"))) return;
                  router.push({
                    pathname: "/report",
                    params: { entityType: "0", entityId: profile.userId },
                  });
                }}
              />
              <Button
                label={t("publicProfile.actions.block")}
                variant="ghost"
                size="sm"
                disabled={friendAction === "block"}
                onPress={() => setBlockConfirmOpen(true)}
              />
            </View>
          ) : null}

          <BottomSheet
            visible={blockConfirmOpen}
            onClose={() => {
              if (friendAction !== "block") {
                setBlockConfirmOpen(false);
              }
            }}
            title={t("publicProfile.blockSheet.title")}
            subtitle={t("publicProfile.blockSheet.subtitle")}
          >
            <Button
              label={t("publicProfile.blockSheet.confirm")}
              variant="danger"
              isLoading={friendAction === "block"}
              disabled={friendAction === "block"}
              onPress={() => void handleBlock()}
            />
          </BottomSheet>
        </>
      )}
    </AppScreen>
  );
}
