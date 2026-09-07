import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  Avatar,
  AppScreen,
  Button,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createReview,
  listEventReviews,
  listReviewablePeers,
} from "@/services/reviews-service";
import type { ApiReview, ApiReviewablePeer } from "@/types/reviews";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function EventReviewsScreen() {
  const { t } = useTranslation(["eventReviews", "events"]);
  const params = useLocalSearchParams<{ id: string; userId?: string }>();
  const id = firstParam(params.id);
  const presetUserId = firstParam(params.userId);
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [peers, setPeers] = useState<ApiReviewablePeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    presetUserId ?? null,
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) {
      return;
    }
    try {
      const [page, reviewable] = await Promise.all([
        listEventReviews(id),
        listReviewablePeers(id).catch(() => []),
      ]);
      setReviews(page?.items ?? []);
      setPeers(reviewable);
      setSelectedUserId((current) => {
        const preferred = current ?? presetUserId ?? null;
        if (preferred && reviewable.some((peer) => peer.userId === preferred)) {
          return preferred;
        }
        return preferred && reviewable.length === 0 ? preferred : current;
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("eventReviews:toasts.loadFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submit = async () => {
    if (!id || !selectedUserId || saving) {
      return;
    }
    setSaving(true);
    try {
      await createReview({
        eventId: id,
        reviewedUserId: selectedUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      setComment("");
      setSelectedUserId(null);
      showToast({
        type: "success",
        title: t("eventReviews:toasts.sentTitle"),
        description: t("eventReviews:toasts.sentDescription"),
      });
      await load();
    } catch (error) {
      showToast({
        type: "error",
        title: t("eventReviews:toasts.sendFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title={t("eventReviews:title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label={t("eventReviews:loading")} />
        </View>
      ) : (
        <>
          {peers.length > 0 ? (
            <View className="gap-3 rounded-3xl border border-border-default bg-surface-primary p-4">
              <Text className="font-display text-base text-text-primary">
                {t("eventReviews:form.heading")}
              </Text>
              <Text className="font-body text-xs text-brand-neutral">
                {t("eventReviews:form.hint")}
              </Text>
              {peers.map((peer) => (
                <Pressable
                  key={peer.userId}
                  onPress={() => setSelectedUserId(peer.userId)}
                  className={`flex-row items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                    selectedUserId === peer.userId
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-border-default"
                  }`}
                >
                  <Avatar
                    uri={peer.profileImageUrl}
                    name={peer.username || peer.firstName}
                    size={36}
                    borderWidth={0}
                  />
                  <Text className="font-body text-sm text-text-primary">
                    @
                    {peer.username || t("events:fallback.athleteHandle")}
                  </Text>
                </Pressable>
              ))}
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      rating >= value ? "bg-brand-primary" : "bg-white/10"
                    }`}
                  >
                    <Text
                      className={`font-mono ${
                        rating >= value
                          ? "text-brand-secondary"
                          : "text-text-primary"
                      }`}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={t("eventReviews:form.commentPlaceholder")}
                placeholderTextColor="#64748b"
                className="rounded-2xl border border-border-default px-4 py-3 font-body text-text-primary"
              />
              <Button
                label={t("eventReviews:form.submit")}
                disabled={!selectedUserId}
                isLoading={saving}
                onPress={submit}
              />
            </View>
          ) : (
            <View className="gap-2 rounded-3xl border border-border-default bg-surface-primary p-4">
              <Text className="font-display text-base text-text-primary">
                {t("eventReviews:emptyPeers.title")}
              </Text>
              <Text className="font-body text-sm leading-5 text-brand-neutral">
                {t("eventReviews:emptyPeers.description")}
              </Text>
            </View>
          )}

          <Text className="font-display text-base text-text-primary">
            {t("eventReviews:list.heading")}
          </Text>
          {reviews.length === 0 ? (
            <Text className="font-body text-sm text-brand-neutral">
              {t("eventReviews:list.empty")}
            </Text>
          ) : (
            reviews.map((review) => (
              <View
                key={review.id}
                className="rounded-2xl border border-border-default bg-surface-primary p-4"
              >
                <View className="flex-row items-center gap-3">
                  <Avatar
                    uri={review.reviewerProfileImageUrl}
                    name={review.reviewerUsername || review.reviewerFirstName}
                    size={36}
                    borderWidth={0}
                  />
                  <Text className="flex-1 font-body text-sm font-semibold text-text-primary">
                    @
                    {review.reviewerUsername ||
                      t("events:fallback.athleteHandle")}{" "}
                    → @
                    {review.reviewedUsername || t("events:fallback.athleteHandle")}
                  </Text>
                </View>
                <Text className="mt-1 font-mono text-xs text-amber-300">
                  {review.rating}/5
                </Text>
                {review.comment ? (
                  <Text className="mt-2 font-body text-sm text-brand-neutral">
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}
