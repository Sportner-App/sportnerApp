import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";
import { PROFILE_COPY, PROFILE_MENU_GROUPS } from "@/constants/profile";

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
      entering={FadeInDown.duration(420).delay(140)}
      className="gap-7"
    >
      {PROFILE_MENU_GROUPS.map((group) => (
        <View key={group.key} className="gap-3">
          <Text className="font-display text-lg text-text-primary">
            {group.title}
          </Text>
          <View className="overflow-hidden rounded-[22px] border border-border-default bg-surface-primary">
            {group.items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => onItemPress(item.key)}
                className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary ${
                  index < group.items.length - 1
                    ? "border-b border-border-default"
                    : ""
                }`}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
                  <FontAwesome6 name={item.icon} size={12} color="#ccff00" />
                </View>
                <Text className="flex-1 font-body text-sm font-semibold text-text-primary">
                  {item.label}
                </Text>
                <FontAwesome6 name="chevron-right" size={10} color="#6f7d86" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Button
        label={PROFILE_COPY.logout}
        variant="danger"
        icon="right-from-bracket"
        isLoading={isSigningOut}
        onPress={onLogout}
      />
    </Animated.View>
  );
}
