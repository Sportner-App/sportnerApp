import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
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
};

const VISIBLE_SPORT_COUNT = 4;

export function SportsSection({ profile, onPress }: SportsSectionProps) {
  const sports = [...profile.sports].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  const visible = sports.slice(0, VISIBLE_SPORT_COUNT);
  const remaining = sports.length - visible.length;

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(90)}
      className="gap-2.5"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-base text-white">
          {PROFILE_COPY.sportsTitle}
        </Text>
        {onPress ? (
          <Pressable onPress={onPress} hitSlop={8}>
            <Text className="font-body text-xs font-semibold text-brand-primary">
              {sports.length === 0 ? "Ekle" : "Tümü"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {sports.length === 0 ? (
        <Pressable
          disabled={!onPress}
          onPress={onPress}
          className="rounded-2xl border border-dashed border-white/15 bg-brand-surface/60 px-4 py-5"
        >
          <Text className="text-center font-body text-sm text-brand-neutral">
            {onPress ? PROFILE_COPY.emptySports : PROFILE_COPY.emptySportsPublic}
          </Text>
        </Pressable>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {visible.map((sport) => {
            const skill = SKILL_LEVEL_LABELS[skillKeyFromCode(sport.skillLevel)];
            return (
              <Pressable
                key={sport.sportId}
                disabled={!onPress}
                onPress={onPress}
                className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                  sport.isPrimary
                    ? "border-brand-primary/35 bg-brand-primary/10"
                    : "border-white/10 bg-brand-surface"
                }`}
              >
                <FontAwesome6
                  name={sportIconForSlug(sport.sportSlug)}
                  size={11}
                  color="#ccff00"
                />
                <Text className="font-body text-xs font-semibold text-white">
                  {sport.sportName}
                </Text>
                <Text className="font-body text-[10px] text-brand-neutral">
                  {skill}
                </Text>
              </Pressable>
            );
          })}
          {remaining > 0 ? (
            <Pressable
              disabled={!onPress}
              onPress={onPress}
              className="rounded-full border border-white/10 bg-brand-surface px-3 py-2"
            >
              <Text className="font-mono text-xs text-brand-neutral">
                +{remaining}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}
