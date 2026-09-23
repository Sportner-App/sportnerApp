import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";

import { heroFadeScale, heroFadeUp } from "./hero-enter";
import { AppText as Text } from "@/components/app-text";

export function IntroChatVisual() {
  const { t } = useTranslation("firstLaunch");

  return (
    <View>
      <View className="absolute -right-8 top-2 h-40 w-40 rounded-full bg-brand-primary/10" />
      <Animated.View
        entering={heroFadeUp(220, 0, 8)}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/95"
      >
        <View className="flex-row items-center gap-3 border-b border-white/10 p-4">
          <View className="relative h-11 w-11 items-center justify-center rounded-full bg-brand-primary/15">
            <Text className="font-display text-body-sm text-brand-primary">
              AY
            </Text>
            <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-surface bg-brand-primary" />
          </View>
          <View className="flex-1">
            <Text className="font-body-bold text-body-sm text-white">
              {t("visuals.chat.friendName")}
            </Text>
            <Text className="mt-0.5 font-body text-caption text-brand-primary">
              {t("visuals.chat.online")}
            </Text>
          </View>
          <FontAwesome6 name="phone" size={14} color="#9aa7af" />
        </View>

        <View className="gap-2.5 p-4">
          <Animated.View
            entering={heroFadeScale(180, 100, 0.94)}
            className="self-start rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2.5"
          >
            <Text className="font-body text-caption leading-5 text-white">
              {t("visuals.chat.friendMessage")}
            </Text>
          </Animated.View>
          <Animated.View
            entering={heroFadeScale(180, 180, 0.94)}
            className="self-end rounded-2xl rounded-tr-sm bg-brand-primary px-3 py-2.5"
          >
            <Text className="font-body-bold text-caption leading-5 text-brand-secondary">
              {t("visuals.chat.reply")}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        entering={heroFadeUp(180, 280, 6)}
        className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-2"
      >
        <FontAwesome6 name="comment-dots" size={11} color="#ccff00" />
        <Text className="font-body text-body-sm text-brand-primary">
          {t("visuals.chat.friendsAvailable")}
        </Text>
      </Animated.View>
    </View>
  );
}
