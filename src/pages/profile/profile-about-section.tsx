import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useProfileQuickActions } from "@/constants/profile";

type ProfileAboutSectionProps = {
  bio: string | null;
  onFriendsPress?: () => void;
  onBadgesPress?: () => void;
};

export function ProfileAboutSection({
  bio,
  onFriendsPress,
  onBadgesPress,
}: ProfileAboutSectionProps) {
  const { t } = useTranslation("profile");
  const quickActions = useProfileQuickActions();
  const actions =
    onFriendsPress && onBadgesPress
      ? { friends: onFriendsPress, badges: onBadgesPress }
      : null;

  return (
    <Animated.View entering={FadeInDown.duration(320)} className="gap-4 px-1">
      <Text className="font-body text-sm leading-5 text-text-secondary">
        {bio?.trim() || t("about.emptyBio")}
      </Text>

      {actions ? (
        <View className="flex-row gap-3">
          {quickActions.map((item) => (
            <Pressable
              key={item.key}
              onPress={actions[item.key]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              className="min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border-default bg-surface-primary px-3 active:opacity-65"
            >
              <FontAwesome6 name={item.icon} size={12} color="#ccff00" />
              <Text className="font-body text-xs font-semibold text-text-primary">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
