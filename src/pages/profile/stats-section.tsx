import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PROFILE_COPY } from "@/constants/profile";
import type { IconName } from "@/types/components";
import type { ProfileStatistics } from "@/types/profile";

type StatsSectionProps = {
  statistics: ProfileStatistics | null;
};

type StatTile = {
  key: string;
  label: string;
  value: string;
  icon: IconName;
};

export function StatsSection({ statistics }: StatsSectionProps) {
  if (!statistics) {
    return null;
  }

  const tiles: StatTile[] = [
    {
      key: "organized",
      label: "Düzenlenen",
      value: String(statistics.eventsOrganized),
      icon: "calendar-plus",
    },
    {
      key: "joined",
      label: "Katılınan",
      value: String(statistics.eventsJoined),
      icon: "users",
    },
    {
      key: "completed",
      label: "Tamamlanan",
      value: String(statistics.eventsCompleted),
      icon: "circle-check",
    },
    {
      key: "friends",
      label: "Arkadaş",
      value: String(statistics.friendsCount),
      icon: "user-group",
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(120)}
      className="gap-3"
    >
      <Text className="font-display text-base text-white">
        {PROFILE_COPY.statsTitle}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {tiles.map((tile) => (
          <View
            key={tile.key}
            className="min-w-[47%] flex-1 basis-[47%] gap-2 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5"
          >
            <View className="flex-row items-center gap-2">
              <FontAwesome6 name={tile.icon} size={12} color="#ccff00" />
              <Text className="font-mono text-[11px] uppercase tracking-wider text-brand-neutral">
                {tile.label}
              </Text>
            </View>
            <Text className="font-display text-2xl text-white">{tile.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
