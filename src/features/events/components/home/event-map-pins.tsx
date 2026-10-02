import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { ImageBackground, Pressable, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  FALLBACK_SPORT_IMAGE,
  resolveEventPhoto,
} from "@/features/sports/sport-images";
import { HIT_SLOP, shadows, themeColors } from "@/constants/theme";
import { AppText as Text, Chip } from "@/components";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/features/events/types";
import { relativeEventBadge } from "@/features/events/format";
import { formatClockTime } from "@/utils/date-format";

/**
 * Kullanıcının kendi konumu. Spor pinlerinden kasıtlı olarak farklı bir
 * biçimde: yuvarlak nokta + hale, ikon yok — böylece etkinlik pinleriyle
 * karıştırılmaz.
 */
export function CurrentLocationPin() {
  return (
    <View className="h-8 w-8 items-center justify-center">
      <View
        className="absolute h-8 w-8 rounded-full"
        style={{ backgroundColor: `${themeColors.brand.primary}33` }}
      />
      <View
        className="h-3.5 w-3.5 rounded-full border-2 border-white"
        style={{ backgroundColor: themeColors.brand.primary }}
      />
    </View>
  );
}

export function EventMapPin({
  icon,
  accent,
  active,
}: {
  icon: IconName;
  accent: string;
  active: boolean;
}) {
  return (
    <View className="items-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full border-2 bg-background-primary ${
          active ? "border-brand-primary" : "border-white/25"
        }`}
      >
        <FontAwesome6 name={icon} size={15} color={accent} />
      </View>
      <View
        className="-mt-1 h-2 w-2 rotate-45"
        style={{
          backgroundColor: active
            ? themeColors.brand.primary
            : "rgba(255,255,255,0.25)",
        }}
      />
    </View>
  );
}

export function EventMapPreviewCard({
  event,
  onClose,
  onPress,
}: {
  event: EventSummary;
  onClose: () => void;
  onPress: () => void;
}) {
  const { t } = useTranslation("home");
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = resolveEventPhoto(event.sportCoverImageUrl);
  const badge = relativeEventBadge(event.eventDate);
  const time = formatClockTime(event.eventDate);
  const whenLabel = [badge, time].filter(Boolean).join(" · ");
  const place = event.location.trim();
  const sportLabel = event.sportName.trim();

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      className="absolute inset-x-3 bottom-3"
      style={shadows.lg}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("map.openPreviewAccessibility", {
          title: event.title,
        })}
        onPress={onPress}
        className="h-[136px] overflow-hidden rounded-[22px] border border-border-default active:opacity-90"
      >
        <ImageBackground
          source={photoFailed ? FALLBACK_SPORT_IMAGE : photo}
          resizeMode="cover"
          onError={() => setPhotoFailed(true)}
          style={{ flex: 1 }}
        >
          <View pointerEvents="none" className="absolute inset-0 bg-black/55" />

          <View className="flex-1 justify-between p-3.5">
            {sportLabel ? (
              <Chip
                variant="sport"
                sport={event.sport}
                icon={event.sportIcon}
                label={sportLabel}
              />
            ) : (
              <View />
            )}

            <View className="flex-row items-end justify-between gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Text
                  numberOfLines={1}
                  className="font-display text-body-lg text-white"
                >
                  {event.title.trim() || t("eventCard.untitled")}
                </Text>
                {place ? (
                  <View className="flex-row items-center gap-1.5">
                    <FontAwesome6
                      name="location-dot"
                      size={9}
                      color="rgba(255,255,255,0.75)"
                    />
                    <Text
                      numberOfLines={1}
                      className="flex-1 font-body text-caption text-white/75"
                    >
                      {place}
                    </Text>
                  </View>
                ) : null}
                {whenLabel ? (
                  <Text className="font-body-bold text-overline text-white/75">
                    {whenLabel}
                  </Text>
                ) : null}
              </View>

              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <FontAwesome6 name="chevron-right" size={12} color="#fff" />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("map.closePreviewAccessibility")}
        onPress={onClose}
        hitSlop={HIT_SLOP}
        className="absolute -top-3 -right-1 h-7 w-7 items-center justify-center rounded-full border border-border-default bg-background-primary active:opacity-80"
      >
        <FontAwesome6
          name="xmark"
          size={11}
          color={themeColors.text.secondary}
        />
      </Pressable>
    </Animated.View>
  );
}
