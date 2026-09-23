import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppScreen } from "@/components";
import type { IconName } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

type PlaceholderTabProps = {
  title: string;
  description: string;
  icon: IconName;
};

export function PlaceholderTab({
  title,
  description,
  icon,
}: PlaceholderTabProps) {
  return (
    <AppScreen
      withTabBar
      scroll={false}
      contentClassName="items-center justify-center px-6"
    >
      <Animated.View
        entering={FadeInDown.duration(420)}
        className="items-center gap-4"
      >
        <View className="h-16 w-16 items-center justify-center rounded-3xl border border-brand-primary/25 bg-brand-primary/10">
          <FontAwesome6 name={icon} size={24} color="#ccff00" />
        </View>
        <Text className="font-display text-heading-md text-text-primary">
          {title}
        </Text>
        <Text className="max-w-[260px] text-center font-body text-body-sm leading-5 text-brand-neutral">
          {description}
        </Text>
      </Animated.View>
    </AppScreen>
  );
}
