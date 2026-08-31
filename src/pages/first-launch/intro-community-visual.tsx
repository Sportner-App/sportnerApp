import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { heroFadeScale, heroFadeUp } from "./hero-enter";

export function IntroCommunityVisual() {
  return (
    <View>
      <View className="absolute -left-8 top-6 h-40 w-40 rounded-full bg-brand-primary/8" />
      <Animated.View
        entering={heroFadeUp(220, 0, 8)}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/95"
      >
        <View className="flex-row items-center gap-3 p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/10">
            <Text className="font-display text-sm text-brand-primary">DE</Text>
          </View>
          <View className="flex-1">
            <Text className="font-body-bold text-sm text-white">Deniz Er</Text>
            <Text className="font-body text-xs text-brand-neutral">
              Koşu · 12 dk
            </Text>
          </View>
          <FontAwesome6 name="ellipsis" size={14} color="#6f7d86" />
        </View>
        <View className="h-36 items-center justify-center bg-brand-raised">
          <View className="absolute h-28 w-28 rounded-full border-[18px] border-brand-primary/10" />
          <FontAwesome6 name="person-running" size={40} color="#ccff00" />
          <View className="absolute bottom-3 right-3 rounded-full bg-brand-secondary/80 px-3 py-1.5">
            <Text className="font-mono text-[10px] text-white">
              5.2 KM · 28 DK
            </Text>
          </View>
        </View>
        <Text className="px-4 pt-3 font-body text-sm leading-5 text-white">
          Sabah koşusu tamam! Bugün kimler hareket etti? 🏃
        </Text>
        <View className="flex-row items-center gap-5 px-4 py-4">
          <Animated.View
            entering={heroFadeScale(180, 180, 0.9)}
            className="flex-row items-center gap-1.5"
          >
            <FontAwesome6 name="heart" size={14} color="#ccff00" />
            <Text className="font-body-bold text-xs text-white">24</Text>
          </Animated.View>
          <View className="flex-row items-center gap-1.5">
            <FontAwesome6 name="comment" size={14} color="#9aa7af" />
            <Text className="font-body text-xs text-white/65">8 yorum</Text>
          </View>
          <View className="ml-auto">
            <FontAwesome6 name="paper-plane" size={14} color="#9aa7af" />
          </View>
        </View>
      </Animated.View>
      <Animated.View
        entering={heroFadeUp(180, 280, 6)}
        className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2"
      >
        <FontAwesome6 name="users" size={11} color="#ccff00" />
        <Text className="font-body text-sm text-brand-primary">
          Topluluk hareket halinde
        </Text>
      </Animated.View>
    </View>
  );
}
