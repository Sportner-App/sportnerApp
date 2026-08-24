import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { EventDetail } from "@/types/events";
import { eventStatusLabel } from "@/utils/events";

type DetailHeroProps = {
  event: EventDetail;
};

export function DetailHero({ event }: DetailHeroProps) {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(60)}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90 p-5"
    >
      <View className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-primary/10" />
      <View className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-primary/10" />

      <View className="h-16 w-16 items-center justify-center rounded-3xl border border-brand-primary/20 bg-brand-primary/10">
        <FontAwesome6 name={event.sportIcon} size={26} color="#ccff00" />
      </View>

      <Text className="mt-4 font-display text-3xl leading-9 text-white">
        {event.title}
      </Text>
      <Pressable onPress={() => router.push(`/users/${event.organizerUserId}`)}>
        <Text className="mt-1.5 font-body text-sm text-brand-neutral">
          {event.hostName} düzenliyor
        </Text>
      </Pressable>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <FontAwesome6 name={event.sportIcon} size={11} color="#64748b" />
          <Text className="font-body text-xs text-brand-neutral">
            {event.sportName}
          </Text>
        </View>

        <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Text className="font-body text-xs text-brand-neutral">
            {event.durationLabel}
          </Text>
        </View>
        <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Text className="font-body text-xs text-brand-neutral">
            {eventStatusLabel(event.status)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
