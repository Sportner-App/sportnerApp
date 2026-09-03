import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  PROFILE_COPY,
  SKILL_LEVEL_LABELS,
  skillKeyFromCode,
} from "@/constants/profile";
import type { UserProfile } from "@/types/profile";
import { sportIconForSlug } from "@/utils/events";

type SportsSectionProps = {
  profile: UserProfile;
  onPress?: () => void;
  onAdd?: () => void;
};

export function SportsSection({ profile, onPress, onAdd }: SportsSectionProps) {
  const sports = [...profile.sports].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  const primarySport = sports.find((sport) => sport.isPrimary) ?? sports[0];
  const rating =
    profile.statistics?.averageRating ?? profile.averageRating ?? 0;
  const reviewCount =
    profile.statistics?.totalReviews ?? profile.reviewCount ?? 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(90)}
      className="gap-3"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-lg text-text-primary">
          {PROFILE_COPY.sportsTitle}
        </Text>
        {onPress ? (
          <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sporları düzenle"
            className="min-h-[36px] flex-row items-center gap-1.5 rounded-full px-2 active:opacity-65"
          >
            <Text className="font-body text-xs font-semibold text-brand-primary">
              Düzenle
            </Text>
          </Pressable>
        ) : null}
      </View>

      {sports.length === 0 ? (
        <Pressable
          disabled={!onAdd && !onPress}
          onPress={onAdd ?? onPress}
          className="rounded-[20px] border border-dashed border-border-strong bg-surface-primary/50 px-4 py-5"
        >
          <Text className="text-center font-body text-sm text-text-secondary">
            {onAdd || onPress
              ? PROFILE_COPY.emptySports
              : PROFILE_COPY.emptySportsPublic}
          </Text>
        </Pressable>
      ) : (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <ScrollView
              horizontal
              className="min-w-0 flex-1"
              contentContainerClassName="gap-2 pr-2"
              showsHorizontalScrollIndicator={false}
            >
              {sports.map((sport) => (
                <Pressable
                  key={sport.sportId}
                  disabled={!onPress}
                  onPress={onPress}
                  className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                    sport.isPrimary
                      ? "border-brand-primary/40 bg-brand-primary/10"
                      : "border-border-default bg-surface-primary"
                  }`}
                >
                  <FontAwesome6
                    name={sportIconForSlug(sport.sportSlug)}
                    size={11}
                    color="#ccff00"
                  />
                  <Text className="font-body text-xs font-semibold text-text-primary">
                    {sport.sportName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {onAdd ? (
              <Pressable
                onPress={onAdd}
                accessibilityRole="button"
                accessibilityLabel="Spor ekle veya düzenle"
                className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary active:opacity-75"
              >
                <FontAwesome6 name="plus" size={13} color="#06111a" />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row overflow-hidden rounded-[22px] border border-border-default bg-surface-primary">
            <View className="flex-1 items-center px-3 py-4">
              <Text className="font-body text-[10px] uppercase tracking-[1.2px] text-text-tertiary">
                Ana spor seviyesi
              </Text>
              <Text className="mt-2 font-display text-xl text-brand-primary">
                {primarySport
                  ? SKILL_LEVEL_LABELS[
                      skillKeyFromCode(primarySport.skillLevel)
                    ]
                  : "—"}
              </Text>
              <Text className="mt-1 font-body text-[10px] text-text-secondary">
                {primarySport?.sportName ?? "Spor eklenmedi"}
              </Text>
            </View>
            <View className="my-3 w-px bg-border-default" />
            <View className="flex-1 items-center px-3 py-4">
              <Text className="font-body text-[10px] uppercase tracking-[1.2px] text-text-tertiary">
                Oyuncu puanı
              </Text>
              <View className="mt-2 flex-row items-center gap-1.5">
                <Text className="font-display text-xl text-brand-primary">
                  {Number(rating).toFixed(1)}
                </Text>
                <FontAwesome6 name="star" size={12} color="#ccff00" />
              </View>
              <Text className="mt-1 font-body text-[10px] text-text-secondary">
                {reviewCount} değerlendirme
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}
