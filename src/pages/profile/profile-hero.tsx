import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PROFILE_COPY } from "@/constants/profile";
import type { UserProfile } from "@/types/profile";

import { ProfileIntroVideo } from "./profile-intro-video";

type ProfileHeroProps = {
  profile: UserProfile;
  onEdit?: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileHero({ profile, onEdit }: ProfileHeroProps) {
  const rating =
    profile.statistics?.averageRating ?? profile.averageRating ?? 0;
  const reviews = profile.statistics?.totalReviews ?? profile.reviewCount ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(380)} className="gap-4">
      <View className="flex-row items-center gap-4">
        <View className="h-[76px] w-[76px] items-center justify-center rounded-full border border-brand-primary/40 bg-brand-primary/10 p-[2px]">
          <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-surface">
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                className="h-full w-full"
              />
            ) : (
              <Text className="font-display text-2xl text-brand-primary">
                {getInitials(profile.fullName)}
              </Text>
            )}
          </View>
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              className="shrink font-display text-[26px] text-white"
            >
              {profile.fullName}
            </Text>
            {!profile.isProfilePublic ? (
              <FontAwesome6 name="lock" size={11} color="#94a3b8" />
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            className="mt-0.5 font-body text-sm text-brand-neutral"
          >
            @{profile.username}
            {profile.city ? `  ·  ${profile.city}` : ""}
          </Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <FontAwesome6 name="star" size={11} color="#fbbf24" />
            <Text className="font-mono text-xs text-amber-300">
              {Number(rating).toFixed(1)}
            </Text>
            <Text className="font-body text-xs text-brand-neutral">
              · {reviews} değerlendirme
            </Text>
          </View>
        </View>
      </View>

      {profile.introVideoUrl?.trim() ? (
        <ProfileIntroVideo uri={profile.introVideoUrl} />
      ) : null}

      {profile.bio ? (
        <Text
          numberOfLines={3}
          className="font-body text-sm leading-5 text-brand-neutral"
        >
          {profile.bio}
        </Text>
      ) : null}

      {onEdit ? (
        <Pressable
          onPress={onEdit}
          className="flex-row items-center justify-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/15 py-2.5 active:opacity-80"
        >
          <FontAwesome6 name="pen" size={11} color="#ccff00" />
          <Text className="font-body text-sm font-semibold text-brand-primary">
            {PROFILE_COPY.edit}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
