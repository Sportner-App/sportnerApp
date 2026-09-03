import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components";
import type { UserProfile } from "@/types/profile";

type ProfileHeroProps = {
  profile: UserProfile;
  onEdit?: () => void;
};

export function ProfileHero({ profile, onEdit }: ProfileHeroProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      className="flex-row items-center gap-4 px-1 py-2"
    >
      <Avatar
        uri={profile.avatarUrl}
        name={profile.fullName}
        size={82}
        borderWidth={2}
      />

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-display text-[22px] text-text-primary"
        >
          @{profile.username}
        </Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          <Text
            numberOfLines={1}
            className="shrink font-body text-sm text-text-secondary"
          >
            {profile.fullName}
          </Text>
          {!profile.isProfilePublic ? (
            <FontAwesome6 name="lock" size={9} color="#6f7d86" />
          ) : null}
        </View>
        {profile.city ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <FontAwesome6 name="location-dot" size={9} color="#ccff00" />
            <Text className="font-body text-[11px] text-text-tertiary">
              {profile.city}
            </Text>
          </View>
        ) : null}
      </View>

      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Profili düzenle"
          className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface-primary active:opacity-70"
        >
          <FontAwesome6 name="pen" size={11} color="#ccff00" />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
