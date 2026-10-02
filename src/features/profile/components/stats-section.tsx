import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useStatItems } from "@/features/profile/copy";
import type { ProfileStatistics } from "@/features/profile/types";
import { AppText as Text } from "@/components";

type StatsSectionProps = {
  statistics: ProfileStatistics | null;
};

export function StatsSection({ statistics }: StatsSectionProps) {
  const statItems = useStatItems();

  if (!statistics) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(60)}
      className="flex-row rounded-[22px] border border-border-default bg-background-secondary/70 py-3.5"
    >
      {statItems.map((item, index) => (
        <View
          key={item.key}
          className={`flex-1 items-center px-1 ${
            index > 0 ? "border-l border-border-default" : ""
          }`}
        >
          <Text className="font-body-bold text-heading-sm text-text-primary">
            {statistics[item.field]}
          </Text>
          <Text className="mt-1 font-body text-overline text-text-tertiary">
            {item.label}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}
