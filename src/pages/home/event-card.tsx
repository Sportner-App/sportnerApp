import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { EventSummary } from "@/types/events";
import {
  formatDurationLabel,
  formatEventTime,
  relativeEventBadge,
} from "@/utils/events";

type EventCardProps = {
  event: EventSummary;
  index: number;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_MS = 120;

export function EventCard({ event, index, onPress }: EventCardProps) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const max = event.maxParticipants;
  const occupied = Math.max(event.participantCount, 0);
  const unlimited = max == null;
  const isFull = max != null && max > 0 && occupied >= max;
  const spotsLeft = max == null ? null : Math.max(max - occupied, 0);
  const fillRatio =
    max == null || max <= 0 ? null : Math.min(Math.max(occupied / max, 0), 1);

  const time = formatEventTime(event.eventDate);
  const duration =
    event.durationMinutes > 0
      ? formatDurationLabel(event.durationMinutes)
      : "";
  const when = [time, duration].filter(Boolean).join(" · ");
  const badge = relativeEventBadge(event.eventDate);
  const sportLabel = event.sportName.trim().toLocaleUpperCase("tr-TR");
  const location = event.location?.trim() || "Konum yok";
  const title = event.title.trim() || "Etkinlik";

  const remainingLabel = unlimited
    ? "∞ yer kaldı"
    : isFull
      ? "Etkinlik dolu"
      : `${spotsLeft} yer kaldı`;

  const whenSpoken = badge
    ? [badge.toLocaleLowerCase("tr-TR"), time ? `saat ${time}` : null]
        .filter(Boolean)
        .join(" ")
    : event.dateLabel.trim() || null;

  const accessibilityLabel = [
    sportLabel ? `${sportLabel} etkinliği` : "Etkinlik",
    title,
    whenSpoken,
    location,
    `${occupied} katılımcı`,
    unlimited ? "sınırsız kapasite" : `kapasite ${max} kişi`,
    remainingLabel,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 70)}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.985, { duration: PRESS_MS });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: PRESS_MS });
        }}
        style={pressStyle}
        className="overflow-hidden rounded-3xl border border-white/10 bg-brand-surface/90 p-4"
      >
        <View
          pointerEvents="none"
          className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-primary/10"
        />
        <View
          pointerEvents="none"
          className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand-primary/10"
        />

        <View className="flex-row items-center justify-between">
          {sportLabel ? (
            <Text className="font-body text-[11px] font-semibold tracking-widest text-brand-primary">
              {sportLabel}
            </Text>
          ) : (
            <View />
          )}
          {badge ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-brand-primary/15 px-2 py-0.5">
              <View className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              <Text className="font-body text-[10px] font-semibold tracking-wide text-brand-primary">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-3 flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10">
            <FontAwesome6 name={event.sportIcon} size={20} color="#ccff00" />
          </View>

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={2}
              className="font-display text-lg leading-6 text-white"
            >
              {title}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <View className="flex-row items-center gap-1">
                <FontAwesome6 name="location-dot" size={10} color="#64748b" />
                <Text
                  numberOfLines={1}
                  className="max-w-[140px] font-body text-xs text-brand-neutral"
                >
                  {location}
                </Text>
              </View>
              {when ? (
                <View className="flex-row items-center gap-1">
                  <FontAwesome6 name="clock" size={10} color="#64748b" />
                  <Text className="font-body text-xs text-brand-neutral">
                    {when}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="mt-3.5 flex-row items-center justify-end">
          <View className="flex-row items-center gap-1.5">
            <FontAwesome6
              name="user-group"
              size={11}
              color={isFull ? "#fda4af" : "#ccff00"}
            />
            <Text className="font-body text-sm text-white">
              {unlimited ? `${occupied}` : `${occupied} / ${max}`}
              <Text className="text-brand-neutral"> kişi</Text>
            </Text>
          </View>
        </View>

        {fillRatio != null ? (
          <View className="mt-2.5 h-1 overflow-hidden rounded-full bg-brand-raised">
            <View
              className="h-full rounded-full bg-brand-primary"
              style={{ width: `${fillRatio * 100}%` }}
            />
          </View>
        ) : null}

        <View className="mt-2.5 flex-row items-center justify-between">
          <Text
            className={`font-body text-xs ${
              isFull ? "text-[#fda4af]" : "text-white"
            }`}
          >
            {remainingLabel}
          </Text>
          <FontAwesome6 name="chevron-right" size={11} color="#f8fafc" />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
