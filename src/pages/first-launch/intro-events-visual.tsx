import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { heroFadeUp } from "./hero-enter";

function TimeSlot({
  time,
  label,
  active,
  delay,
}: {
  time: string;
  label: string;
  active?: boolean;
  delay: number;
}) {
  return (
    <Animated.View
      entering={heroFadeUp(200, delay, 6)}
      className={`flex-1 items-center rounded-2xl border px-2 py-2.5 ${
        active
          ? "border-brand-primary/35 bg-brand-primary/12"
          : "border-white/10 bg-brand-raised/80"
      }`}
    >
      <Text
        className={`font-mono text-[11px] ${
          active ? "text-brand-primary" : "text-brand-neutral"
        }`}
      >
        {time}
      </Text>
      <Text
        className={`mt-1 font-body text-xs ${
          active ? "text-white" : "text-brand-neutral"
        }`}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

function CapacityBar() {
  const fill = useSharedValue(0);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(260, withTiming(0.6, { duration: 300 }));
  }, [fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * fill.value,
  }));

  return (
    <View
      className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
      onLayout={(event) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        className="h-full rounded-full bg-brand-primary"
        style={fillStyle}
      />
    </View>
  );
}

export function IntroEventsVisual() {
  const { height } = useWindowDimensions();
  const compact = height < 720;

  return (
    <View>
      <View className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-brand-primary/8" />

      <Animated.View
        entering={heroFadeUp(200, 0, 6)}
        className="mb-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
          <Text className="font-mono text-[11px] tracking-[2px] text-white/70">
            BUGÜN
          </Text>
        </View>
        <Text className="font-body text-xs text-brand-neutral">4 açık maç</Text>
      </Animated.View>

      <Animated.View
        entering={heroFadeUp(220, 40, 10)}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/95 p-4"
      >
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-display text-[34px] leading-[34px] text-brand-primary">
              20:30
            </Text>
            <Text className="mt-2 font-body text-lg font-semibold text-white">
              Halı saha
            </Text>
            <Text className="mt-1 font-body text-sm text-brand-neutral">
              Kadıköy · Futbol
            </Text>
          </View>
          <View className="items-end gap-2">
            <View className="rounded-full bg-brand-primary px-2.5 py-1">
              <Text className="font-mono text-[10px] text-brand-secondary">
                AÇIK
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-2xl border border-brand-primary/25 bg-brand-primary/10">
              <FontAwesome6 name="futbol" size={16} color="#ccff00" />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-3">
          <CapacityBar />
          <Text className="font-mono text-xs text-brand-primary">3 / 5</Text>
        </View>
        <Text className="mt-2 font-body text-xs text-brand-neutral">
          2 yer kaldı · bu akşam
        </Text>
      </Animated.View>

      {compact ? null : (
        <View className="mt-3 flex-row gap-2">
          <TimeSlot time="08:00" label="Koşu" delay={180} />
          <TimeSlot time="20:30" label="Futbol" active delay={220} />
          <TimeSlot time="21:00" label="Tenis" delay={260} />
        </View>
      )}

      <Animated.View
        entering={heroFadeUp(200, 300, 6)}
        className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2"
      >
        <FontAwesome6 name="bolt" size={11} color="#ccff00" />
        <Text className="font-body text-sm text-brand-primary">
          Mahallede şimdi açık
        </Text>
      </Animated.View>
    </View>
  );
}
