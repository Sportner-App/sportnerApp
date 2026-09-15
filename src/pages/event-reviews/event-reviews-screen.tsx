import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { lightImpact } from "@/utils/haptics";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type Step = "choose" | "rate";

/** Feedback starts with the event owner; teammates are a short optional follow-up. */
export function EventReviewsScreen() {
  const { t } = useTranslation(["eventReviews", "events"]);
  const params = useLocalSearchParams<{ id: string; userId?: string }>();
  const id = firstParam(params.id);
  const presetUserId = firstParam(params.userId);
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [peers, setPeers] = useState<ApiReviewablePeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>("choose");
  const [selectedPeer, setSelectedPeer] = useState<ApiReviewablePeer | null>(
    null,
  );
  const [showTeammates, setShowTeammates] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const organizer = useMemo(
    () => peers.find((peer) => peer.isOrganizer) ?? null,
    [peers],
  );
  const teammates = useMemo(
    () => peers.filter((peer) => !peer.isOrganizer),
    [peers],
  );

  const load = async () => {
    if (!id) return;
    try {
      const [page, reviewable] = await Promise.all([
        listEventReviews(id),
        listReviewablePeers(id).catch(() => []),
      ]);
      setReviews(page?.items ?? []);
      setPeers(reviewable);
      if (presetUserId) {
        const preferred = reviewable.find(
          (peer) => peer.userId === presetUserId,
        );
        if (preferred) {
          setSelectedPeer(preferred);
          setStep("rate");
        }
      }
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

  const choosePeer = (peer: ApiReviewablePeer) => {
    lightImpact();
    setSelectedPeer(peer);
    setRating(null);
    setComment("");
    setStep("rate");
  };

  const submit = async () => {
    if (!id || !selectedPeer || rating == null || saving) return;
    setSaving(true);
    try {
      await createReview({
        eventId: id,
        reviewedUserId: selectedPeer.userId,
        rating,
        comment: comment.trim() || undefined,
      });
      showToast({
        type: "success",
        title: t("eventReviews:toasts.sentTitle"),
        description: t("eventReviews:toasts.sentDescription"),
      });
      setSelectedPeer(null);
      setRating(null);
      setComment("");
      setStep("choose");
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
      ) : step === "rate" && selectedPeer ? (
        <RatingForm
          peer={selectedPeer}
          rating={rating}
          comment={comment}
          saving={saving}
          onBack={() => {
            setStep("choose");
            setSelectedPeer(null);
          }}
          onRating={setRating}
          onComment={setComment}
          onSubmit={() => void submit()}
        />
      ) : peers.length > 0 ? (
        <>
          <View className="gap-1">
            <Text className="font-display text-xl text-text-primary">
              {t("eventReviews:choose.heading")}
            </Text>
            <Text className="font-body text-sm leading-5 text-brand-neutral">
              {t("eventReviews:choose.hint")}
            </Text>
          </View>
          {organizer ? (
            <OrganizerCard peer={organizer} onPress={choosePeer} />
          ) : null}
          {teammates.length > 0 ? (
            <View className="rounded-3xl border border-border-default bg-surface-primary">
              <Pressable
                onPress={() => setShowTeammates((value) => !value)}
                className="flex-row items-center gap-3 p-4 active:opacity-80"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <FontAwesome6 name="people-group" size={15} color="#cbd5e1" />
                </View>
                <View className="flex-1">
                  <Text className="font-body text-sm font-semibold text-text-primary">
                    {t("eventReviews:choose.teammatesTitle", {
                      count: teammates.length,
                    })}
                  </Text>
                  <Text className="font-body text-xs text-brand-neutral">
                    {t("eventReviews:choose.teammatesHint")}
                  </Text>
                </View>
                <FontAwesome6
                  name={showTeammates ? "chevron-up" : "chevron-down"}
                  size={12}
                  color="#94a3b8"
                />
              </Pressable>
              {showTeammates ? (
                <View className="gap-2 border-t border-border-default p-3">
                  {teammates.map((peer) => (
                    <PeerRow
                      key={peer.userId}
                      peer={peer}
                      onPress={choosePeer}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <View className="gap-2 rounded-3xl border border-border-default bg-surface-primary p-5">
          <Text className="font-display text-base text-text-primary">
            {t("eventReviews:emptyPeers.title")}
          </Text>
          <Text className="font-body text-sm leading-5 text-brand-neutral">
            {t("eventReviews:emptyPeers.description")}
          </Text>
        </View>
      )}
      <ReviewList reviews={reviews} />
    </AppScreen>
  );
}

function OrganizerCard({
  peer,
  onPress,
}: {
  peer: ApiReviewablePeer;
  onPress: (peer: ApiReviewablePeer) => void;
}) {
  const { t } = useTranslation(["eventReviews", "events"]);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(peer)}
      className="flex-row items-center gap-3 rounded-3xl border border-brand-primary/40 bg-brand-primary/10 p-4 active:opacity-80"
    >
      <Avatar
        uri={peer.profileImageUrl}
        name={peer.username || peer.firstName}
        size={48}
        borderWidth={0}
      />
      <View className="flex-1 gap-0.5">
        <Text className="font-mono text-[10px] text-brand-primary">
          {t("eventReviews:choose.organizerEyebrow")}
        </Text>
        <Text className="font-body text-base font-semibold text-text-primary">
          @{peer.username || t("events:fallback.athleteHandle")}
        </Text>
        <Text className="font-body text-xs text-brand-neutral">
          {t("eventReviews:choose.organizerHint")}
        </Text>
      </View>
      <FontAwesome6 name="chevron-right" size={12} color="#ccff00" />
    </Pressable>
  );
}

function PeerRow({
  peer,
  onPress,
}: {
  peer: ApiReviewablePeer;
  onPress: (peer: ApiReviewablePeer) => void;
}) {
  const { t } = useTranslation("events");
  return (
    <Pressable
      onPress={() => onPress(peer)}
      className="flex-row items-center gap-3 rounded-2xl px-2 py-2 active:bg-white/5"
    >
      <Avatar
        uri={peer.profileImageUrl}
        name={peer.username || peer.firstName}
        size={36}
        borderWidth={0}
      />
      <Text className="flex-1 font-body text-sm text-text-primary">
        @{peer.username || t("fallback.athleteHandle")}
      </Text>
      <FontAwesome6 name="chevron-right" size={11} color="#94a3b8" />
    </Pressable>
  );
}

function RatingForm({
  peer,
  rating,
  comment,
  saving,
  onBack,
  onRating,
  onComment,
  onSubmit,
}: {
  peer: ApiReviewablePeer;
  rating: number | null;
  comment: string;
  saving: boolean;
  onBack: () => void;
  onRating: (value: number) => void;
  onComment: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation(["eventReviews", "events"]);
  const context = peer.isOrganizer ? "organizer" : "teammate";
  const ratingLabel =
    rating == null
      ? t("eventReviews:rating.unselected")
      : t(`eventReviews:rating.${context}.${rating}`);
  return (
    <View className="gap-4 rounded-3xl border border-border-default bg-surface-primary p-5">
      <Pressable onPress={onBack} className="self-start py-1 active:opacity-70">
        <Text className="font-body text-sm font-semibold text-brand-primary">
          {t("eventReviews:form.back")}
        </Text>
      </Pressable>
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={peer.profileImageUrl}
          name={peer.username || peer.firstName}
          size={52}
          borderWidth={0}
        />
        <View className="flex-1">
          <Text className="font-mono text-[10px] text-brand-primary">
            {t(`eventReviews:form.${context}Eyebrow`)}
          </Text>
          <Text className="font-display text-lg text-text-primary">
            @{peer.username || t("events:fallback.athleteHandle")}
          </Text>
        </View>
      </View>
      <Text className="font-body text-sm leading-5 text-brand-neutral">
        {t(`eventReviews:form.${context}Question`)}
      </Text>
      <View className="flex-row justify-between gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = rating === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t("eventReviews:rating.accessibility", {
                value,
              })}
              onPress={() => {
                lightImpact();
                onRating(value);
              }}
              className={`h-11 w-11 items-center justify-center rounded-full border ${active ? "border-brand-primary bg-brand-primary" : "border-border-default bg-white/5"}`}
            >
              <Text
                className={`font-mono text-sm ${active ? "text-brand-secondary" : "text-text-primary"}`}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-center font-body text-xs text-brand-neutral">
        {ratingLabel}
      </Text>
      <TextInput
        value={comment}
        onChangeText={onComment}
        multiline
        maxLength={1000}
        placeholder={t("eventReviews:form.commentPlaceholder")}
        placeholderTextColor="#64748b"
        className="min-h-[94px] rounded-2xl border border-border-default px-4 py-3 font-body text-text-primary"
      />
      <Button
        label={t("eventReviews:form.submit")}
        disabled={rating == null}
        isLoading={saving}
        onPress={onSubmit}
      />
      <Text className="text-center font-body text-[11px] leading-4 text-text-secondary">
        {t("eventReviews:form.visibilityNote")}
      </Text>
    </View>
  );
}

function ReviewList({ reviews }: { reviews: ApiReview[] }) {
  const { t } = useTranslation(["eventReviews", "events"]);
  return (
    <View className="gap-3">
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
                @{review.reviewerUsername || t("events:fallback.athleteHandle")}{" "}
                → @
                {review.reviewedUsername || t("events:fallback.athleteHandle")}
              </Text>
              <Text className="font-mono text-xs text-amber-300">
                {review.rating}/5
              </Text>
            </View>
            {review.comment ? (
              <Text className="mt-2 font-body text-sm text-brand-neutral">
                {review.comment}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
