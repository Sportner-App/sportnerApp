import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  BottomSheet,
  Button,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { ProfileHero } from "@/pages/profile/profile-hero";
import { ReviewsSection } from "@/pages/profile/reviews-section";
import { SportsSection } from "@/pages/profile/sports-section";
import { StatsSection } from "@/pages/profile/stats-section";
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

type FriendAction = "send" | "accept" | "reject" | "block" | null;

export function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [friendAction, setFriendAction] = useState<FriendAction>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    void getPublicProfile(id)
      .then(async (next) => {
        const friendship =
          next.friendship ??
          (await resolveFriendshipWith(next.userId).catch(() => null));
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
          title: "Profil yok",
          description: getApiErrorMessage(error),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [id, showToast]);

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
      showToast({ type: "success", title: "İstek gönderildi" });
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
        title: "Gönderilemedi",
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
      showToast({ type: "success", title: "Arkadaş eklendi" });
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: "Kabul edilemedi",
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
      showToast({ type: "success", title: "İstek reddedildi" });
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: "Reddedilemedi",
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
      showToast({ type: "success", title: "Kullanıcı engellendi" });
      router.back();
    } catch (error) {
      errorNotification();
      showToast({
        type: "error",
        title: "Engellenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setFriendAction(null);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="PROFİL" showBack />}
      contentClassName="gap-6 px-5 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={140} label="Profil yükleniyor" />
        </View>
      ) : !profile ? (
        <Text className="text-center font-body text-sm text-brand-neutral">
          Profil bulunamadı.
        </Text>
      ) : (
        <>
          <ProfileHero profile={profile} />
          <StatsSection statistics={profile.statistics} />
          <SportsSection profile={profile} />
          <ReviewsSection reviews={reviews} isLoading={reviewsLoading} />

          <View className="gap-2">
            {isIncomingPending ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Kabul et"
                    size="sm"
                    isLoading={friendAction === "accept"}
                    disabled={friendAction === "reject"}
                    onPress={() => void handleAccept()}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Reddet"
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
                        label="Arkadaşsınız"
                        variant="secondary"
                        size="sm"
                        disabled
                      />
                    ) : isOutgoingPending ? (
                      <Button
                        label="İstek gönderildi"
                        variant="secondary"
                        size="sm"
                        disabled
                      />
                    ) : (
                      <Button
                        label="Arkadaş ekle"
                        size="sm"
                        isLoading={friendAction === "send"}
                        onPress={() => void handleSend()}
                      />
                    )}
                  </View>
                ) : null}
                <View className="flex-1">
                  <Button
                    label="Şikayet et"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: "/report",
                        params: { entityType: "0", entityId: profile.userId },
                      })
                    }
                  />
                </View>
              </View>
            ) : null}

            {!isMe ? (
              <Button
                label="Engelle"
                variant="ghost"
                size="sm"
                disabled={friendAction === "block"}
                onPress={() => setBlockConfirmOpen(true)}
              />
            ) : null}
          </View>

          <BottomSheet
            visible={blockConfirmOpen}
            onClose={() => {
              if (friendAction !== "block") {
                setBlockConfirmOpen(false);
              }
            }}
            title="Bu kişiyi engellemek istiyor musun?"
            subtitle="Birbirinizi listelerde ve profilde göremezsiniz. İstediğin zaman Gizlilik’ten engeli kaldırabilirsin."
          >
            <Button
              label="Engelle"
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
