import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { UserIdentity } from "@/components";
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
      className="gap-3"
    >
      <Text className="font-display text-lg text-text-primary">
        {PROFILE_COPY.reviewsTitle}
      </Text>

      {isLoading ? (
        <Text className="font-body text-sm text-text-secondary">
          Değerlendirmeler yükleniyor…
        </Text>
      ) : reviews.length === 0 ? (
        <Text className="font-body text-sm text-text-secondary">
          {PROFILE_COPY.emptyReviews}
        </Text>
      ) : (
        reviews.map((review) => (
          <View
            key={review.id}
            className="gap-1.5 border-b border-border-default px-1 pb-4 pt-1"
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
        ))
      )}
    </Animated.View>
  );
}
