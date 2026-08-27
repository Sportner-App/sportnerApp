import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components";
import type { UserProfile } from "@/types/profile";

import { ProfileIntroVideo } from "./profile-intro-video";

type ProfileHeroProps = {
  profile: UserProfile;
  onEdit?: () => void;
};

export function ProfileHero({ profile, onEdit }: ProfileHeroProps) {
  const rating =
    profile.statistics?.averageRating ?? profile.averageRating ?? 0;
  const reviews = profile.statistics?.totalReviews ?? profile.reviewCount ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(380)} className="gap-4">
      <View className="relative overflow-hidden rounded-[28px] border border-border-default bg-surface-primary px-5 py-5">
        <View className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[28px] border-brand-primary/10" />
        <View className="absolute right-10 top-6 h-3 w-3 rounded-full bg-brand-primary/25" />

        <View className="flex-row items-start gap-4">
          <Avatar
            uri={profile.avatarUrl}
            name={profile.fullName}
            size={72}
            borderWidth={2}
          />

          <View className="min-w-0 flex-1 pt-1">
            <Text
              numberOfLines={1}
              className="font-display text-[23px] text-text-primary"
            >
              {profile.fullName}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Text
                numberOfLines={1}
                className="shrink font-body text-xs text-text-secondary"
              >
                @{profile.username}
              </Text>
              {!profile.isProfilePublic ? (
                <FontAwesome6 name="lock" size={9} color="#6f7d86" />
              ) : null}
            </View>
            {profile.city ? (
              <View className="mt-2 flex-row items-center gap-1.5">
                <FontAwesome6 name="location-dot" size={9} color="#ccff00" />
                <Text className="font-body text-[11px] text-text-secondary">
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
              className="h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-background-secondary/80 active:opacity-70"
            >
              <FontAwesome6 name="pen" size={11} color="#ccff00" />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-5 flex-row items-center border-t border-border-default pt-4">
          <View className="flex-1">
            <Text className="font-mono-bold text-base text-text-primary">
              {Number(rating).toFixed(1)}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              <FontAwesome6 name="star" size={8} color="#ccff00" />
              <Text className="font-body text-[10px] text-text-tertiary">
                Puan
              </Text>
            </View>
          </View>
          <View className="h-7 w-px bg-border-default" />
          <View className="flex-1 pl-4">
            <Text className="font-mono-bold text-base text-text-primary">
              {reviews}
            </Text>
            <Text className="mt-0.5 font-body text-[10px] text-text-tertiary">
              Değerlendirme
            </Text>
          </View>
        </View>
      </View>

      {profile.introVideoUrl?.trim() ? (
        <ProfileIntroVideo uri={profile.introVideoUrl} />
      ) : null}

      {profile.bio ? (
        <View className="px-1">
          <Text className="font-body text-[10px] font-semibold tracking-[1.5px] text-text-tertiary">
            HAKKIMDA
          </Text>
          <Text
            numberOfLines={3}
            className="mt-2 font-body text-sm leading-5 text-text-secondary"
          >
            {profile.bio}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
