import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components";
import {
  PROFILE_COPY,
  PROFILE_MENU_GROUPS,
  PROFILE_SOCIAL_ACTIONS,
} from "@/constants/profile";

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
      <View className="gap-3">
        <Text className="font-display text-lg text-text-primary">
          {PROFILE_COPY.socialTitle}
        </Text>
        <View className="flex-row rounded-[22px] border border-border-default bg-surface-primary px-1 py-3">
          {PROFILE_SOCIAL_ACTIONS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => onItemPress(item.key)}
              className="flex-1 items-center gap-2 py-1 active:opacity-65"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background-secondary">
                <FontAwesome6 name={item.icon} size={12} color="#ccff00" />
              </View>
              <Text
                numberOfLines={1}
                className="font-body text-[9px] font-semibold text-text-secondary"
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
