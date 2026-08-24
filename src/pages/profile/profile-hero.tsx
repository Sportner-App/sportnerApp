import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Image, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { UserProfile } from "@/types/profile";

type ProfileHeroProps = {
  profile: UserProfile;
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

export function ProfileHero({ profile }: ProfileHeroProps) {
  const rating =
    profile.statistics?.averageRating ?? profile.averageRating ?? 0;
  const reviews = profile.statistics?.totalReviews ?? profile.reviewCount ?? 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(420)}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90 p-5"
    >
      <View className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-primary/10" />
      <View className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-primary/10" />

      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-brand-primary/30 bg-brand-primary/15">
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} className="h-16 w-16" />
          ) : (
            <Text className="font-display text-xl text-brand-primary">
              {getInitials(profile.fullName)}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="font-display text-2xl text-white">
            {profile.fullName}
          </Text>
          <Text className="mt-0.5 font-body text-sm text-brand-neutral">
            @{profile.username}
            {profile.city ? ` · ${profile.city}` : ""}
          </Text>
        </View>

        {!profile.isProfilePublic ? (
          <View className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <FontAwesome6 name="lock" size={11} color="#64748b" />
          </View>
        ) : null}
      </View>

      {profile.bio ? (
        <Text className="mt-4 font-body text-sm leading-5 text-brand-neutral">
          {profile.bio}
        </Text>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5">
          <FontAwesome6 name="star" size={11} color="#fcd34d" />
          <Text className="font-mono text-xs text-amber-300">
            {Number(rating).toFixed(1)}
          </Text>
        </View>
        <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Text className="font-body text-xs text-brand-neutral">
            {reviews} değerlendirme
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
