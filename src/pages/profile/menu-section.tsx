import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";
import { PROFILE_COPY, PROFILE_MENU_ITEMS } from "@/constants/profile";

type MenuSectionProps = {
  onItemPress: (key: string) => void;
  onLogout: () => void;
  isSigningOut: boolean;
};

export function MenuSection({
  onItemPress,
  onLogout,
  isSigningOut,
}: MenuSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(160)}
      className="gap-3"
    >
      <Text className="font-display text-base text-white">
        {PROFILE_COPY.menuTitle}
      </Text>

      <View className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90">
        {PROFILE_MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.key}
            onPress={() => onItemPress(item.key)}
            className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-white/5 ${
              index < PROFILE_MENU_ITEMS.length - 1
                ? "border-b border-white/5"
                : ""
            }`}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
              <FontAwesome6 name={item.icon} size={14} color="#ccff00" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-white">
                {item.label}
              </Text>
              <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                {item.description}
              </Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color="#64748b" />
          </Pressable>
        ))}
      </View>

      <Button
        label={PROFILE_COPY.logout}
        variant="outline"
        icon="right-from-bracket"
        isLoading={isSigningOut}
        onPress={onLogout}
      />
    </Animated.View>
  );
}
