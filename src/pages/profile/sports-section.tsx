import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  PROFILE_COPY,
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_STYLES,
  skillKeyFromCode,
} from "@/constants/profile";
import type { UserProfile } from "@/types/profile";
import { sportIconForSlug } from "@/utils/events";

type SportsSectionProps = {
  profile: UserProfile;
  onPress?: () => void;
};

export function SportsSection({ profile, onPress }: SportsSectionProps) {
  if (profile.sports.length === 0) {
    return (
      <Animated.View
        entering={FadeInDown.duration(420).delay(80)}
        className="gap-3"
      >
        <Text className="font-display text-base text-white">
          {PROFILE_COPY.sportsTitle}
        </Text>
        <View className="items-center rounded-2xl border border-white/10 bg-brand-surface/60 px-4 py-8">
          <Text className="font-body text-sm text-brand-neutral">
            {PROFILE_COPY.emptySports}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(80)}
      className="gap-3"
    >
      <Text className="font-display text-base text-white">
        {PROFILE_COPY.sportsTitle}
      </Text>

      <Pressable disabled={!onPress} onPress={onPress} className="gap-2">
        {profile.sports.map((sport) => {
          const skill = skillKeyFromCode(sport.skillLevel);
          const skillStyle = SKILL_LEVEL_STYLES[skill];

          return (
            <View
              key={sport.sportId}
              className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
                <FontAwesome6
                  name={sportIconForSlug(sport.sportSlug)}
                  size={15}
                  color="#ccff00"
                />
              </View>

              <View className="flex-1">
                <Text className="font-body text-sm font-semibold text-white">
                  {sport.sportName}
                </Text>
                {sport.isPrimary ? (
                  <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-primary">
                    Birincil
                  </Text>
                ) : null}
              </View>

              <View
                className={`rounded-full border px-2.5 py-1 ${skillStyle.container}`}
              >
                <Text className={`font-body text-xs ${skillStyle.text}`}>
                  {SKILL_LEVEL_LABELS[skill]}
                </Text>
              </View>
            </View>
          );
        })}
      </Pressable>
    </Animated.View>
  );
}
