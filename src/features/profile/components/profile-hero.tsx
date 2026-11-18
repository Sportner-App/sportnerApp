import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText as Text, Avatar } from "@/components";
import type { UserProfile } from "@/features/profile/types";
import type { IconName } from "@/types/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";

type ProfileHeroProps = {
  profile: UserProfile;
  onEdit?: () => void;
  onSettings?: () => void;
  onPostsPress?: () => void;
  onFriendsPress?: () => void;
  onBadgesPress?: () => void;
};

export function ProfileHero({
  profile,
  onEdit,
  onSettings,
  onPostsPress,
  onFriendsPress,
  onBadgesPress,
}: ProfileHeroProps) {
  const { t } = useTranslation(["profile", "auth"]);

  const genderLabel =
    profile.gender === 1
      ? t("auth:gender.female")
      : profile.gender === 2
        ? t("auth:gender.male")
        : null;
  const ageGenderLabel = [profile.age, genderLabel]
    .filter((value) => value !== null && value !== undefined)
    .join(" · ");
  const stats = profile.statistics;

  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      className="gap-4 px-1 py-2"
    >
      <View className="flex-row items-center gap-4">
        <Avatar
          uri={profile.avatarUrl}
          name={profile.fullName}
          size={82}
          borderWidth={2}
        />

        <View className="min-w-0 flex-1 gap-1.5">
          <Text
            numberOfLines={1}
            className="font-display text-heading-md text-text-primary"
          >
            @{profile.username}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className="shrink font-body text-body-sm text-text-secondary"
            >
              {profile.fullName}
            </Text>
            {!profile.isProfilePublic ? (
              <FontAwesome6
                name="lock"
                size={9}
                color={themeColors.text.tertiary}
              />
            ) : null}
          </View>
          {ageGenderLabel || profile.city ? (
            <View className="mt-0.5 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
              {ageGenderLabel ? (
                <View className="flex-row items-center gap-1.5">
                  <FontAwesome6
                    name="cake-candles"
                    size={10}
                    color={themeColors.brand.primary}
                  />
                  <Text className="font-body text-caption text-text-tertiary">
                    {ageGenderLabel}
                  </Text>
                </View>
              ) : null}
              {profile.city ? (
                <View className="flex-row items-center gap-1.5">
                  <FontAwesome6
                    name="location-dot"
                    size={10}
                    color={themeColors.brand.primary}
                  />
                  <Text className="font-body text-caption text-text-tertiary">
                    {profile.city}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {onEdit || onSettings ? (
          <View className="flex-row gap-2 self-start">
            {onEdit ? (
              <HeroIconButton
                icon="pen"
                label={t("hero.editAccessibility")}
                onPress={onEdit}
              />
            ) : null}
            {onSettings ? (
              <HeroIconButton
                icon="gear"
                label={t("hero.settingsAccessibility")}
                onPress={onSettings}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row">
        <HeroCount
          value={stats?.postsCount}
          label={t("hero.counts.posts", { count: stats?.postsCount ?? 0 })}
          onPress={onPostsPress}
        />
        <HeroCount
          value={stats?.friendsCount}
          label={t("hero.counts.friends", { count: stats?.friendsCount ?? 0 })}
          onPress={onFriendsPress}
        />
        <HeroCount
          value={stats?.badgesCount}
          label={t("hero.counts.badges", { count: stats?.badgesCount ?? 0 })}
          onPress={onBadgesPress}
        />
      </View>
    </Animated.View>
  );
}

function HeroIconButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface-primary active:opacity-70"
    >
      <FontAwesome6 name={icon} size={12} color={themeColors.brand.primary} />
    </Pressable>
  );
}

/** Instagram tarzı sayı: üstte rakam, altta etiket. */
function HeroCount({
  value,
  label,
  onPress,
}: {
  value: number | undefined;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${value ?? 0} ${label}`}
      className="flex-1 items-center gap-0.5 rounded-xl py-1 active:bg-surface-primary"
    >
      <Text className="font-display text-heading-sm text-text-primary">
        {value ?? 0}
      </Text>
      <Text className="font-body text-caption text-text-secondary">
        {label}
      </Text>
    </Pressable>
  );
}
