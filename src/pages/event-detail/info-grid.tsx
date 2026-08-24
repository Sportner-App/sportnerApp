import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { IconName } from "@/types/components";
import type { EventDetail } from "@/types/events";

type InfoGridProps = {
  event: EventDetail;
};

type InfoTile = {
  icon: IconName;
  label: string;
  value: string;
};

export function InfoGrid({ event }: InfoGridProps) {
  const tiles: InfoTile[] = [
    { icon: "calendar-days", label: "Tarih", value: event.dateLabel },
    { icon: "clock", label: "Süre", value: event.durationLabel },
    { icon: "location-dot", label: "Konum", value: event.location },
    { icon: "map-pin", label: "Adres", value: event.address },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(140)}
      className="flex-row flex-wrap gap-3"
    >
      {tiles.map((tile) => (
        <View
          key={tile.label}
          className="min-h-[92px] w-[47%] flex-1 basis-[47%] gap-2 rounded-3xl border border-white/10 bg-brand-surface/90 p-4"
        >
          <View className="flex-row items-center gap-2">
            <FontAwesome6 name={tile.icon} size={12} color="#ccff00" />
            <Text className="font-mono text-[11px] uppercase tracking-wider text-brand-neutral">
              {tile.label}
            </Text>
          </View>
          <Text className="font-body text-sm font-semibold leading-5 text-white">
            {tile.value}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}
