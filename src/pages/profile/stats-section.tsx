import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { ProfileStatistics } from "@/types/profile";

type StatsSectionProps = {
  statistics: ProfileStatistics | null;
};

const STAT_ITEMS: { key: string; label: string; field: keyof ProfileStatistics }[] =
  [
    { key: "joined", label: "Katılım", field: "eventsJoined" },
    { key: "organized", label: "Düzenlenen", field: "eventsOrganized" },
    { key: "completed", label: "Maç", field: "eventsCompleted" },
    { key: "friends", label: "Arkadaş", field: "friendsCount" },
  ];

export function StatsSection({ statistics }: StatsSectionProps) {
  if (!statistics) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(60)}
      className="flex-row rounded-2xl border border-brand-primary/20 bg-brand-surface py-3"
    >
      {STAT_ITEMS.map((item, index) => (
        <View
          key={item.key}
          className={`flex-1 items-center px-1 ${
            index > 0 ? "border-l border-white/10" : ""
          }`}
        >
          <Text className="font-display text-xl text-brand-primary">
            {statistics[item.field]}
          </Text>
          <Text className="mt-0.5 font-body text-[11px] text-brand-neutral">
            {item.label}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}
