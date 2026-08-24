import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { EventDetail } from "@/types/events";

type AboutSectionProps = {
  event: EventDetail;
};

export function AboutSection({ event }: AboutSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(300)}
      className="gap-3 rounded-3xl border border-white/10 bg-brand-surface/90 p-5"
    >
      <Text className="font-display text-base text-white">
        Etkinlik Hakkında
      </Text>
      <Text className="font-body text-sm leading-6 text-brand-neutral">
        {event.description}
      </Text>

      <View className="mt-1 flex-row items-center gap-3 border-t border-white/5 pt-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
          <Text className="font-body text-xs font-semibold text-brand-primary">
            {event.hostName[0]?.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text className="font-body text-sm font-semibold text-white">
            {event.hostName}
          </Text>
          <Text className="font-body text-xs text-brand-neutral">
            Düzenleyen
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
