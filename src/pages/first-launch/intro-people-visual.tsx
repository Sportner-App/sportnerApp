import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { heroFadeScale, heroFadeUp } from "./hero-enter";

export function IntroPeopleVisual() {
  return (
    <View className="gap-3">
      <View className="absolute -right-8 top-2 h-40 w-40 rounded-full bg-brand-primary/10" />
      <Animated.View
        entering={heroFadeUp(220, 0, 8)}
        className="rounded-[28px] border border-white/10 bg-brand-surface/95 p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/15">
              <FontAwesome6 name="calendar-plus" size={15} color="#ccff00" />
            </View>
            <View>
              <Text className="font-body-bold text-base text-white">
                Akşam maçı
              </Text>
              <Text className="font-body text-xs text-brand-neutral">
                20:30 · Kadıköy
              </Text>
            </View>
          </View>
          <View className="rounded-full bg-brand-primary px-2.5 py-1">
            <Text className="font-mono text-[10px] text-brand-secondary">
              OLUŞTU
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center">
          {["AY", "EG", "LR"].map((name, index) => (
            <Animated.View
              key={name}
              entering={heroFadeScale(180, 80 + index * 45, 0.94)}
              className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-surface bg-brand-raised"
              style={{ marginLeft: index ? -8 : 0 }}
            >
              <Text className="font-display text-xs text-brand-primary">
                {name}
              </Text>
            </Animated.View>
          ))}
          <Text className="ml-3 font-body text-xs text-white/65">
            3 davet gönderildi
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        entering={heroFadeUp(220, 180, 8)}
        className="ml-8 rounded-[24px] border border-white/10 bg-brand-raised/95 p-4"
      >
        <View className="flex-row items-center gap-2">
          <FontAwesome6 name="comments" size={12} color="#ccff00" />
          <Text className="font-mono text-[10px] tracking-[1.5px] text-brand-primary">
            ETKİNLİK SOHBETİ
          </Text>
        </View>
        <View className="mt-3 self-start rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2">
          <Text className="font-body text-xs text-white">
            Sahada 20:15’te buluşalım mı?
          </Text>
        </View>
        <View className="mt-2 self-end rounded-2xl rounded-tr-sm bg-brand-primary px-3 py-2">
          <Text className="font-body-bold text-xs text-brand-secondary">
            Tamamdır, görüşürüz! 🙌
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
