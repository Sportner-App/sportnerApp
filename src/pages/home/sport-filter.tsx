import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, ScrollView, Text } from "react-native";

import { SPORT_FILTERS } from "@/constants/events";
import { sportAccentForSlug, themeColors } from "@/constants/theme";

type SportFilterProps = {
  value: string;
  onChange: (key: string) => void;
};

export function SportFilter({ value, onChange }: SportFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-sm pr-xl"
    >
      {SPORT_FILTERS.map((sport) => {
        const isActive = sport.key === value;
        const sportAccent =
          sport.key === "all"
            ? null
            : sportAccentForSlug(sport.key, themeColors.text.secondary);

        return (
          <Pressable
            key={sport.key}
            onPress={() => onChange(sport.key)}
            className={`flex-row items-center gap-2 rounded-pill border px-lg py-sm ${
              isActive
                ? "border-brand-primary bg-brand-primary"
                : "border-border-default bg-surface-primary"
            }`}
          >
            <FontAwesome6
              name={sport.icon}
              size={13}
              color={
                isActive
                  ? themeColors.text.onPrimary
                  : (sportAccent ?? themeColors.text.secondary)
              }
            />
            <Text
              className="font-body text-sm font-semibold"
              style={{
                color: isActive
                  ? themeColors.text.onPrimary
                  : themeColors.text.secondary,
              }}
            >
              {sport.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
