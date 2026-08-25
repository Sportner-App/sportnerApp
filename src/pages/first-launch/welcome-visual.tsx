import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import { heroFadeScale, heroFadeUp } from "./hero-enter";

function Initials({
  letters,
  className,
}: {
  letters: string;
  className?: string;
}) {
  return (
    <View
      className={`h-12 w-12 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-raised ${className ?? ""}`}
    >
      <Text className="font-display text-sm text-brand-primary">{letters}</Text>
    </View>
  );
}

function SportChip({
  icon,
  label,
  className,
  delay,
}: {
  icon: "futbol" | "person-running" | "table-tennis-paddle-ball";
  label: string;
  className: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={heroFadeUp(200, delay, 6)}
      className={`absolute flex-row items-center gap-2 rounded-full border border-white/10 bg-brand-surface/95 px-3.5 py-2 ${className}`}
    >
      <FontAwesome6 name={icon} size={12} color="#ccff00" />
      <Text className="font-body text-sm text-white">{label}</Text>
    </Animated.View>
  );
}

export function WelcomeVisual() {
  const { height } = useWindowDimensions();
  const compact = height < 720;

  return (
    <View className="relative min-h-[260px]">
      <View className="h-[260px] items-center justify-center">
        <Animated.View
          entering={heroFadeScale(260, 50, 0.96)}
          className="absolute h-72 w-72 rounded-full bg-brand-primary/10"
        />
        <Animated.View
          entering={heroFadeScale(260, 50, 0.96)}
          className="absolute h-48 w-48 rounded-full border border-brand-primary/15"
        />

        <Animated.View
          entering={heroFadeScale(220, 0, 0.94)}
          className="z-10 h-28 w-28 items-center justify-center rounded-[36px] border border-brand-primary/35 bg-brand-primary/15"
        >
          <Text className="font-display text-6xl text-brand-primary">S</Text>
        </Animated.View>

        <SportChip
          icon="futbol"
          label="Futbol"
          className="left-1 top-6"
          delay={0}
        />
        <SportChip
          icon="person-running"
          label="Koşu"
          className="right-0 top-14"
          delay={50}
        />
        {compact ? null : (
          <SportChip
            icon="table-tennis-paddle-ball"
            label="Tenis"
            className="left-0 top-32"
            delay={100}
          />
        )}

        <Animated.View
          entering={heroFadeUp(200, 0, 6)}
          className="absolute bottom-12 left-2"
        >
          <Initials letters="AY" />
        </Animated.View>

        <Animated.View
          entering={heroFadeUp(200, 50, 6)}
          className="absolute bottom-16 right-2"
        >
          <Initials letters="EK" />
        </Animated.View>

        <Animated.View
          entering={heroFadeUp(200, 100, 6)}
          className="absolute bottom-5 right-16 rounded-full border border-white/10 bg-brand-raised px-2.5 py-1"
        >
          <Text className="font-mono text-[11px] text-brand-primary">LIVE</Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={heroFadeUp(200, 150, 6)}
        className="flex-row justify-center gap-2 pb-1"
      >
        <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-brand-surface/90 px-3 py-1.5">
          <FontAwesome6 name="user-group" size={10} color="#ccff00" />
          <Text className="font-body text-xs text-white">120+ sporcu</Text>
        </View>
        <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-brand-surface/90 px-3 py-1.5">
          <FontAwesome6 name="calendar-days" size={10} color="#ccff00" />
          <Text className="font-body text-xs text-white">8 açık maç</Text>
        </View>
      </Animated.View>
    </View>
  );
}
