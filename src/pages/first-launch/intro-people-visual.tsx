import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import { heroFadeUp } from "./hero-enter";

function PersonCard({
  initials,
  name,
  sport,
  skill,
  meta,
  delay,
}: {
  initials: string;
  name: string;
  sport: string;
  skill: string;
  meta: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={heroFadeUp(220, delay, 10)}
      className="flex-row items-center gap-3.5 rounded-3xl border border-white/10 bg-brand-surface/95 px-4 py-3.5"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/10">
        <Text className="font-display text-base text-brand-primary">
          {initials}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-body text-base font-semibold text-white">
          {name}
        </Text>
        <Text className="mt-1 font-body text-sm text-brand-neutral">
          {sport} · {skill}
        </Text>
      </View>
      <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <Text className="font-mono text-[11px] text-brand-neutral">{meta}</Text>
      </View>
    </Animated.View>
  );
}

function LinkChip({
  icon,
  label,
  delay,
}: {
  icon: "location-dot" | "user-group" | "futbol";
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

export function IntroPeopleVisual() {
  const { height } = useWindowDimensions();
  const showThird = height >= 720;

  return (
    <View className="gap-3">
      <View className="absolute -right-4 -top-2 h-36 w-36 rounded-full bg-brand-primary/10" />
      <View className="absolute right-8 top-8 h-[88px] w-[88px] rounded-full border border-brand-primary/15" />
      <PersonCard
        initials="EG"
        name="Ege"
        sport="Futbol"
        skill="Orta"
        meta="1.2 km"
        delay={0}
      />
      <PersonCard
        initials="LR"
        name="Lara"
        sport="Tenis"
        skill="İleri"
        meta="800 m"
        delay={60}
      />
      {showThird ? (
        <PersonCard
          initials="CN"
          name="Can"
          sport="Basketbol"
          skill="Orta"
          meta="2.1 km"
          delay={120}
        />
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <LinkChip icon="location-dot" label="Aynı semt" delay={180} />
        <LinkChip icon="futbol" label="3 ortak spor" delay={220} />
        <LinkChip icon="user-group" label="2 eşleşme" delay={260} />
      </View>
      <Animated.View
        entering={heroFadeUp(200, 300, 6)}
        className="flex-row items-center gap-2 self-start rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2"
      >
        <FontAwesome6 name="location-dot" size={11} color="#ccff00" />
        <Text className="font-body text-sm text-brand-primary">
          Yakınında 12 sporcu
        </Text>
      </Animated.View>
    </View>
  );
}
