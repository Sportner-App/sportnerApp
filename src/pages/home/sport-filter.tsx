import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, ScrollView, Text } from "react-native";

import { SPORT_FILTERS } from "@/constants/events";

type SportFilterProps = {
  value: string;
  onChange: (key: string) => void;
};

export function SportFilter({ value, onChange }: SportFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-6"
    >
      {SPORT_FILTERS.map((sport) => {
        const isActive = sport.key === value;

        return (
          <Pressable
            key={sport.key}
            onPress={() => onChange(sport.key)}
            className={`flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${
              isActive
                ? "border-brand-primary bg-brand-primary"
                : "border-white/10 bg-brand-surface/90"
            }`}
          >
            <FontAwesome6
              name={sport.icon}
              size={13}
              color={isActive ? "#0f172a" : "#64748b"}
            />
            <Text
              className={`font-body text-sm font-semibold ${
                isActive ? "text-brand-secondary" : "text-brand-neutral"
              }`}
            >
              {sport.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
