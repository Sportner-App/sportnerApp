import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { UserIdentity } from "@/components";
import { PROFILE_COPY } from "@/constants/profile";
import type { ApiReview } from "@/types/reviews";

type ReviewsSectionProps = {
  reviews: ApiReview[];
  isLoading?: boolean;
  averageRating?: number;
  totalReviews?: number;
};

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewsSection({
  reviews,
  isLoading,
  averageRating = 0,
  totalReviews,
}: ReviewsSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(110)}
      className="gap-3"
    >
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="font-display text-lg text-text-primary">
            {PROFILE_COPY.reviewsTitle}
          </Text>
          <Text className="mt-1 font-body text-[11px] text-text-tertiary">
            Etkinliklerden gelen oyuncu geri bildirimleri
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Text className="font-display text-2xl text-brand-primary">
              {Number(averageRating).toFixed(1)}
            </Text>
            <Text className="text-sm text-brand-primary">★</Text>
          </View>
          <Text className="font-body text-[9px] text-text-tertiary">
            {totalReviews ?? reviews.length} yorum
          </Text>
        </View>
      </View>

      {isLoading ? (
        <Text className="font-body text-sm text-text-secondary">
          Değerlendirmeler yükleniyor…
        </Text>
      ) : reviews.length === 0 ? (
        <Text className="font-body text-sm text-text-secondary">
          {PROFILE_COPY.emptyReviews}
        </Text>
      ) : (
        <View className="overflow-hidden rounded-[22px] border border-border-default bg-surface-primary px-4">
          {reviews.map((review, index) => (
            <View
              key={review.id}
              className={`gap-2 py-4 ${
                index < reviews.length - 1
                  ? "border-b border-border-default"
                  : ""
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="min-w-0 flex-1">
                  <UserIdentity
                    username={review.reviewerUsername}
                    avatarUrl={review.reviewerProfileImageUrl}
                    fallbackName={review.reviewerFirstName}
                    avatarSize={34}
                  />
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-1">
                  <Text className="font-mono-bold text-[10px] text-brand-primary">
                    {Number(review.rating).toFixed(1)}
                  </Text>
                  <Text className="text-[9px] text-brand-primary">★</Text>
                </View>
              </View>
              {review.comment ? (
                <Text className="font-body text-sm leading-5 text-text-secondary">
                  {review.comment}
                </Text>
              ) : null}
              <Text className="font-body text-[10px] text-text-tertiary">
                {formatReviewDate(review.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
