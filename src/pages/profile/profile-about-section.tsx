import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type ProfileAboutSectionProps = {
  bio: string | null;
  onFriendsPress?: () => void;
  onBadgesPress?: () => void;
};

const QUICK_ACTIONS = [
  { key: "friends", label: "Arkadaşlar", icon: "user-group" },
  { key: "badges", label: "Rozetler", icon: "trophy" },
] as const;

export function ProfileAboutSection({
  bio,
  onFriendsPress,
  onBadgesPress,
}: ProfileAboutSectionProps) {
  const actions =
    onFriendsPress && onBadgesPress
      ? { friends: onFriendsPress, badges: onBadgesPress }
      : null;

  return (
    <Animated.View entering={FadeInDown.duration(320)} className="gap-4 px-1">
      <Text className="font-body text-sm leading-5 text-text-secondary">
        {bio?.trim() || "Henüz profil açıklaması eklenmemiş."}
      </Text>

      {actions ? (
        <View className="flex-row gap-3">
          {QUICK_ACTIONS.map((item) => (
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
