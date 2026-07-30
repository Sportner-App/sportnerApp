/**
 * Sports & skills step component for onboarding
 */

import { Pressable, Text, View } from "react-native";

import {
  LEVEL_OPTIONS,
  SPORT_OPTIONS,
} from "@/features/onboarding/model/onboarding-constants";
import type { SkillLevelsMap } from "@/features/onboarding/model/types";

interface SportsStepProps {
  selectedSports: string[];
  skillLevels: SkillLevelsMap;
  onSportToggle: (sportKey: string) => void;
  onSkillLevelChange: (sportKey: string, level: string) => void;
}

export function SportsStep({
  selectedSports,
  skillLevels,
  onSportToggle,
  onSkillLevelChange,
}: SportsStepProps) {
  return (
    <View>
      <Text className="font-display text-xl text-white">Spor ve Seviye</Text>
      <Text className="mt-1 font-body text-sm text-brand-neutral">
        İlgilendiğin sporları ve seviyeni belirle.
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {SPORT_OPTIONS.map((sport) => {
          const active = selectedSports.includes(sport.key);

          return (
            <Pressable
              key={sport.key}
              onPress={() => onSportToggle(sport.key)}
              style={({ pressed }) =>
                pressed ? { transform: [{ scale: 0.97 }] } : undefined
              }
              className={`rounded-full border px-4 py-2 ${
                active
                  ? "border-brand-primary bg-brand-primary"
                  : "border-brand-tertiary bg-brand-raised"
              }`}
            >
              <Text
                className={`font-body text-sm ${
                  active ? "text-brand-secondary" : "text-brand-neutral"
                }`}
              >
                {sport.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 gap-3">
        {selectedSports.map((sportKey) => {
          const label =
            SPORT_OPTIONS.find((item) => item.key === sportKey)?.label ??
            sportKey;

          return (
            <View
              key={sportKey}
              className="rounded-2xl border border-brand-tertiary bg-brand-raised p-3"
            >
              <Text className="font-body text-sm text-white">{label}</Text>

              <View className="mt-2 flex-row flex-wrap gap-2">
                {LEVEL_OPTIONS.map((level) => {
                  const active = skillLevels[sportKey] === level.key;

                  return (
                    <Pressable
                      key={level.key}
                      onPress={() => onSkillLevelChange(sportKey, level.key)}
                      style={({ pressed }) =>
                        pressed ? { transform: [{ scale: 0.96 }] } : undefined
                      }
                      className={`rounded-full border px-3 py-1.5 ${
                        active
                          ? "border-brand-primary bg-brand-primary"
                          : "border-brand-tertiary bg-brand-surface"
                      }`}
                    >
                      <Text
                        className={`font-body text-xs ${
                          active ? "text-brand-secondary" : "text-brand-neutral"
                        }`}
                      >
                        {level.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
