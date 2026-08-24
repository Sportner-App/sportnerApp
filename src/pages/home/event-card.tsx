import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { EventSummary } from "@/types/events";

type EventCardProps = {
  event: EventSummary;
  index: number;
  onPress?: () => void;
};

export function EventCard({ event, index, onPress }: EventCardProps) {
  const capacityLabel =
    event.maxParticipants == null
      ? `${event.participantCount}`
      : `${event.participantCount}/${event.maxParticipants}`;

  const isFull =
    event.maxParticipants != null &&
    event.participantCount >= event.maxParticipants;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 70)}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-3.5 rounded-3xl border border-white/10 bg-brand-surface/90 p-4 active:opacity-80"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10">
          <FontAwesome6 name={event.sportIcon} size={20} color="#ccff00" />
        </View>

        <View className="flex-1 gap-1">
          <Text
            numberOfLines={1}
            className="font-body text-base font-semibold text-white"
          >
            {event.title}
          </Text>
          <Text numberOfLines={1} className="font-body text-xs text-brand-neutral">
            {event.dateLabel} · {event.location}
          </Text>
          <Text className="font-body text-xs text-brand-neutral/80">
            {event.hostName}
          </Text>
        </View>

        <View className="items-end gap-1.5">
          <View className="flex-row items-center gap-1.5">
            <FontAwesome6
              name="user-group"
              size={11}
              color={isFull ? "#fda4af" : "#ccff00"}
            />
            <Text
              className={`font-mono text-xs ${
                isFull ? "text-[#fda4af]" : "text-brand-primary"
              }`}
            >
              {capacityLabel}
            </Text>
          </View>

          <View className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <Text className="font-body text-[11px] text-brand-neutral">
              {event.sportName}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
