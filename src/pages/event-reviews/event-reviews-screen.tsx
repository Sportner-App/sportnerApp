import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AppScreen, Button, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createReview,
  listEventReviews,
  listReviewablePeers,
} from "@/services/reviews-service";
import type { ApiReview, ApiReviewablePeer } from "@/types/reviews";

export function EventReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [peers, setPeers] = useState<ApiReviewablePeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
    } catch (error) {
      showToast({
        type: "error",
        title: "Yüklenemedi",
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
      showToast({ type: "success", title: "Değerlendirme gönderildi" });
      await load();
    } catch (error) {
      showToast({
        type: "error",
        title: "Gönderilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="DEĞERLENDİRME" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          {peers.length > 0 ? (
            <View className="gap-3 rounded-3xl border border-white/10 bg-brand-surface/90 p-4">
              <Text className="font-display text-base text-white">
                Kimi değerlendirmek istersin?
              </Text>
              {peers.map((peer) => (
                <Pressable
                  key={peer.userId}
                  onPress={() => setSelectedUserId(peer.userId)}
                  className={`rounded-2xl border px-3 py-2.5 ${
                    selectedUserId === peer.userId
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-white/10"
                  }`}
                >
                  <Text className="font-body text-sm text-white">
                    {peer.firstName || peer.username}
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
                          : "text-white"
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
                placeholder="Yorum (opsiyonel)"
                placeholderTextColor="#64748b"
                className="rounded-2xl border border-white/10 px-4 py-3 font-body text-white"
              />
              <Button
                label="Gönder"
                disabled={!selectedUserId}
                isLoading={saving}
                onPress={submit}
              />
            </View>
          ) : null}

          <Text className="font-display text-base text-white">
            Bu etkinlikteki yorumlar
          </Text>
          {reviews.length === 0 ? (
            <Text className="font-body text-sm text-brand-neutral">
              Henüz değerlendirme yok.
            </Text>
          ) : (
            reviews.map((review) => (
              <View
                key={review.id}
                className="rounded-2xl border border-white/10 bg-brand-surface/90 p-4"
              >
                <Text className="font-body text-sm font-semibold text-white">
                  {review.reviewerFirstName || review.reviewerUsername} →{" "}
                  {review.reviewedFirstName || review.reviewedUsername}
                </Text>
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
