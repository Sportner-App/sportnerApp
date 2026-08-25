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
      className="gap-6"
    >
      <View className="gap-2.5">
        <Text className="font-display text-base text-white">
          {PROFILE_COPY.socialTitle}
        </Text>
        <View className="gap-2">
          {[0, 2].map((start) => (
            <View key={start} className="flex-row gap-2">
              {PROFILE_SOCIAL_ACTIONS.slice(start, start + 2).map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => onItemPress(item.key)}
                  className="flex-1 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface px-3.5 py-3.5 active:opacity-80"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15">
                    <FontAwesome6 name={item.icon} size={13} color="#ccff00" />
                  </View>
                  <Text className="font-body text-sm font-semibold text-white">
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      {PROFILE_MENU_GROUPS.map((group) => (
        <View key={group.key} className="gap-2.5">
          <Text className="font-display text-base text-white">{group.title}</Text>
          <View className="overflow-hidden rounded-2xl border border-white/10 bg-brand-surface">
            {group.items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => onItemPress(item.key)}
                className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-white/5 ${
                  index < group.items.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-primary/12">
                  <FontAwesome6 name={item.icon} size={13} color="#ccff00" />
                </View>
                <Text className="flex-1 font-body text-sm font-semibold text-white">
                  {item.label}
                </Text>
                <FontAwesome6 name="chevron-right" size={11} color="#64748b" />
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
