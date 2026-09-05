import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { resolveEventBadgeThemes } from "@/constants/badge-colors";
import { FALLBACK_SPORT_IMAGE, resolveEventPhoto } from "@/constants/sport-images";
import {
  media,
  shadows,
  sportAccentToken,
  themeColors,
} from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventDetail } from "@/types/events";
import { relativeEventBadge } from "@/utils/events";

import { PendingRequestsHeaderAction } from "./pending-requests-entry";

type EventDetailHeroProps = {
  event: EventDetail;
  onBack: () => void;
  onShare: () => void;
  pendingCount?: number;
  onPendingPress?: () => void;
};

const HERO_ASPECT = 1.08;
const OVERLAY = themeColors.surface.dark;

export function EventDetailHero({
  event,
  onBack,
  onShare,
  pendingCount = 0,
  onPendingPress,
}: EventDetailHeroProps) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const photo = resolveEventPhoto(event.sportCoverImageUrl);
  const accent = sportAccentToken(event.sport);
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  const sportSoft = accent?.soft ?? themeColors.surface.secondary;
  const onAccent = accent?.onAccent ?? themeColors.text.inverse;
  const sportLabel = event.sportName.trim().toLocaleUpperCase("tr-TR");
  const dateBadge = relativeEventBadge(event.eventDate);
  const badgeThemes = resolveEventBadgeThemes({
    sportAccent: sportColor,
    isPaid: event.isPaid,
    urgency: dateBadge === "BUGÜN" ? "today" : "upcoming",
  });
  const showPending = pendingCount > 0 && onPendingPress;

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={shadows.md}>
      <View
        className="overflow-hidden"
        style={{
          aspectRatio: HERO_ASPECT,

          backgroundColor: sportSoft,
        }}
        onLayout={(layoutEvent) => {
          const { width, height } = layoutEvent.nativeEvent.layout;
          if (width !== size.width || height !== size.height) {
            setSize({ width, height });
          }
        }}
      >
        <HeroPhoto
          image={photo}
          width={size.width}
          height={size.height}
        />
        <HeroReadabilityOverlay
          fadeId={event.id}
          width={size.width}
          height={size.height}
        />

        <View
          className="absolute inset-0 justify-between"
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 14,
            paddingBottom: 14,
          }}
        >
          <View className="flex-row items-start justify-between">
            <GlassControl
              accessibilityLabel="Geri"
              icon="arrow-left"
              onPress={onBack}
            />
            <View className="flex-row items-center gap-2">
              {showPending ? (
                <PendingRequestsHeaderAction
                  count={pendingCount}
                  onPress={onPendingPress}
                />
              ) : null}
              <GlassControl
                accessibilityLabel="Etkinliği paylaş"
                icon="arrow-up-from-bracket"
                onPress={onShare}
              />
            </View>
          </View>

          <View className="flex-row items-end justify-between gap-2">
            {sportLabel ? (
              <View
                className="max-w-[62%] flex-row items-center rounded-pill px-2.5 py-1"
                style={{ backgroundColor: sportColor }}
              >
                <FontAwesome6
                  name={event.sportIcon}
                  size={10}
                  color={onAccent}
                />
                <Text
                  numberOfLines={1}
                  className="ml-1.5 font-body-bold text-[10px] tracking-[1.2px]"
                  style={{ color: onAccent }}
                >
                  {sportLabel}
                </Text>
              </View>
            ) : (
              <View />
            )}
            {dateBadge ? (
              <View
                className="rounded-pill px-2.5 py-1"
                style={{ backgroundColor: badgeThemes.date.background }}
              >
                <Text
                  className="font-body-bold text-[10px] tracking-wide"
                  style={{ color: badgeThemes.date.foreground }}
                >
                  {dateBadge}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function GlassControl({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
      style={{ backgroundColor: themeColors.overlay.dark }}
    >
      <FontAwesome6 name={icon} size={15} color={themeColors.text.inverse} />
    </Pressable>
  );
}

function HeroReadabilityOverlay({
  fadeId,
  width,
  height,
}: {
  fadeId: string;
  width: number;
  height: number;
}) {
  const topId = `hero-top-${fadeId}`;
  const bottomId = `hero-bottom-${fadeId}`;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={topId} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={OVERLAY}
              stopOpacity={media.overlayOpacity}
            />
            <Stop offset="0.38" stopColor={OVERLAY} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={bottomId} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={OVERLAY} stopOpacity="0.38" />
            <Stop offset="0.36" stopColor={OVERLAY} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${topId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${bottomId})`}
        />
      </Svg>
    </View>
  );
}

function HeroPhoto({
  image,
  width,
  height,
}: {
  image: ReturnType<typeof resolveEventPhoto>;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Image
      source={failed ? FALLBACK_SPORT_IMAGE : image}
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: "transparent",
      }}
    />
  );
}
