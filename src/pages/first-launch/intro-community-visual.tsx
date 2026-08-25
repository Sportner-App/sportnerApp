import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { heroFadeScale, heroFadeUp } from "./hero-enter";

const TEAM = [
  { initials: "EG", name: "Ege" },
  { initials: "LR", name: "Lara" },
  { initials: "CN", name: "Can" },
  { initials: "AY", name: "Ayşe" },
] as const;

function SummaryChip({
  icon,
  label,
  delay,
}: {
  icon: "user-group" | "futbol" | "location-dot";
  label: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={heroFadeUp(200, delay, 6)}
      className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-brand-raised/90 px-3 py-1.5"
    >
      <FontAwesome6 name={icon} size={10} color="#ccff00" />
      <Text className="font-body text-xs text-white">{label}</Text>
    </Animated.View>
  );
}

export function IntroCommunityVisual() {
  return (
    <View style={{ marginBottom: -36 }}>
      <View className="absolute -right-8 top-2 h-36 w-36 rounded-full bg-brand-primary/10" />

      <Animated.View
        entering={heroFadeUp(220, 0, 8)}
        className="rounded-[28px] border border-white/10 bg-brand-surface/95 p-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-mono text-[11px] tracking-[2px] text-white/70">
            BU AKŞAM
          </Text>
          <View className="rounded-full bg-brand-primary px-2.5 py-1">
            <Text className="font-mono text-[10px] text-brand-secondary">
              HAZIR
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center">
          {TEAM.map((person, index) => (
            <Animated.View
              key={person.initials}
              entering={heroFadeScale(200, 80 + index * 45, 0.94)}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-raised"
              style={{ marginLeft: index === 0 ? 0 : -10 }}
            >
              <Text className="font-display text-xs text-brand-primary">
                {person.initials}
              </Text>
            </Animated.View>
          ))}
          <Animated.View entering={heroFadeUp(200, 260, 6)}>
            <Text className="ml-3 font-body text-sm text-white">
              Ege, Lara +2
            </Text>
          </Animated.View>
        </View>

        <View className="mt-4 h-px bg-white/8" />

        <View className="mt-4 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/25 bg-brand-primary/10">
            <FontAwesome6 name="futbol" size={16} color="#ccff00" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-base font-semibold text-white">
              Halı saha
            </Text>
            <Text className="mt-0.5 font-body text-xs text-brand-neutral">
              20:30 · Kadıköy · 1.2 km
            </Text>
          </View>
          <Text className="font-mono text-xs text-brand-primary">3 / 5</Text>
        </View>
      </Animated.View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <SummaryChip icon="user-group" label="Partner" delay={200} />
        <SummaryChip icon="futbol" label="Maç" delay={240} />
        <SummaryChip icon="location-dot" label="Topluluk" delay={280} />
      </View>

      <Animated.View
        entering={heroFadeScale(180, 320, 0.96)}
        className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2"
      >
        <FontAwesome6 name="check" size={11} color="#ccff00" />
        <Text className="font-body text-sm text-brand-primary">
          Takım sahada
        </Text>
      </Animated.View>
    </View>
  );
}
