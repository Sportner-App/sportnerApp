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
      className="gap-3"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-lg text-text-primary">
          {PROFILE_COPY.sportsTitle}
        </Text>
        {onPress ? (
          <Pressable onPress={onPress} hitSlop={8}>
            <Text className="font-body text-[11px] font-semibold text-brand-primary">
              {sports.length === 0 ? "Ekle" : "Tümü"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {sports.length === 0 ? (
        <Pressable
          disabled={!onPress}
          onPress={onPress}
          className="rounded-[20px] border border-dashed border-border-strong bg-surface-primary/50 px-4 py-5"
        >
          <Text className="text-center font-body text-sm text-text-secondary">
            {onPress
              ? PROFILE_COPY.emptySports
              : PROFILE_COPY.emptySportsPublic}
          </Text>
        </Pressable>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {visible.map((sport) => {
            const skill =
              SKILL_LEVEL_LABELS[skillKeyFromCode(sport.skillLevel)];
            return (
              <Pressable
                key={sport.sportId}
                disabled={!onPress}
                onPress={onPress}
                className={`flex-row items-center gap-2 rounded-full border px-3 py-2.5 ${
                  sport.isPrimary
                    ? "border-brand-primary/30 bg-brand-primary/10"
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
                <Text className="font-body text-[9px] text-text-tertiary">
                  {skill}
                </Text>
              </Pressable>
            );
          })}
          {remaining > 0 ? (
            <Pressable
              disabled={!onPress}
              onPress={onPress}
              className="rounded-full border border-border-default bg-surface-primary px-3 py-2.5"
            >
              <Text className="font-mono text-xs text-text-secondary">
                +{remaining}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}
