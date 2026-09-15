import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useProfileMenuGroups } from "@/constants/profile";
import { useThemePreference } from "@/contexts";

type MenuSectionProps = {
  onItemPress: (key: string) => void;
};

export function MenuSection({ onItemPress }: MenuSectionProps) {
  const { t } = useTranslation("settings");
  const menuGroups = useProfileMenuGroups();
  const { preference, setPreference } = useThemePreference();
  const isDark = preference === "dark";

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(140)}
      className="gap-7"
    >
      {menuGroups.map((group) => (
        <View key={group.key} className="gap-3">
          <Text className="font-display text-lg text-text-primary">
            {group.title}
          </Text>
          <View className="overflow-hidden rounded-[22px] border border-border-default bg-surface-primary">
            {group.items.map((item, index) => {
              const isAppearance = item.key === "appearance";
              return (
                <Pressable
                  key={item.key}
                  onPress={() =>
                    isAppearance
                      ? setPreference(isDark ? "light" : "dark")
                      : onItemPress(item.key)
                  }
                  className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary ${
                    index < group.items.length - 1
                      ? "border-b border-border-default"
                      : ""
                  }`}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
                    <FontAwesome6
                      name={isAppearance ? (isDark ? "moon" : "sun") : item.icon}
                      size={12}
                      color="#ccff00"
                    />
                  </View>
                  <Text className="flex-1 font-body text-sm font-semibold text-text-primary">
                    {isAppearance ? t(`appearance.${preference}`) : item.label}
                  </Text>
                  {isAppearance ? (
                    <View
                      className={`h-[18px] w-8 justify-center rounded-full px-[2px] ${
                        isDark ? "bg-brand-primary" : "bg-border-strong"
                      }`}
                    >
                      <View
                        className={`h-3.5 w-3.5 rounded-full bg-background-primary ${
                          isDark ? "self-end" : "self-start"
                        }`}
                      />
                    </View>
                  ) : (
                    <FontAwesome6
                      name="chevron-right"
                      size={10}
                      color="#6f7d86"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
