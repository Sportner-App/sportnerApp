import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PROFILE_COPY } from "@/constants/profile";
import type { ApiReview } from "@/types/reviews";

type ReviewsSectionProps = {
  reviews: ApiReview[];
  isLoading?: boolean;
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

export function ReviewsSection({ reviews, isLoading }: ReviewsSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(110)}
      className="gap-2.5"
    >
      <Text className="font-display text-base text-white">
        {PROFILE_COPY.reviewsTitle}
      </Text>

      {isLoading ? (
        <Text className="font-body text-sm text-brand-neutral">
          Değerlendirmeler yükleniyor…
        </Text>
      ) : reviews.length === 0 ? (
        <Text className="font-body text-sm text-brand-neutral">
          {PROFILE_COPY.emptyReviews}
        </Text>
      ) : (
        reviews.map((review) => (
          <View
            key={review.id}
            className="gap-1.5 rounded-2xl border border-white/10 bg-brand-surface p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-sm font-semibold text-white">
                {review.reviewerFirstName || review.reviewerUsername || "Sporcu"}
              </Text>
              <Text className="font-mono text-xs text-amber-300">
                {review.rating}/5
              </Text>
            </View>
            {review.comment ? (
              <Text className="font-body text-sm leading-5 text-slate-300">
                {review.comment}
              </Text>
            ) : null}
            <Text className="font-body text-[11px] text-brand-neutral">
              {formatReviewDate(review.createdAt)}
            </Text>
          </View>
        ))
      )}
    </Animated.View>
  );
}
