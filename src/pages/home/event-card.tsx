import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { SKILL_LEVEL_LABELS, skillKeyFromCode } from "@/constants/profile";
import { sportImageForSlug } from "@/constants/sport-images";
import {
  radius,
  shadows,
  sportAccentToken,
  themeColors,
} from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventSummary } from "@/types/events";
import {
  formatDurationLabel,
  formatEventTime,
  relativeEventBadge,
} from "@/utils/events";

type EventCardProps = {
  event: EventSummary;
  index: number;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_MS = 120;
const MIST = themeColors.surface.primary;

export function EventCard({ event, index, onPress }: EventCardProps) {
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const max = event.maxParticipants;
  const occupied = Math.max(event.participantCount, 0);
  const unlimited = max == null;
  const isFull = max != null && max > 0 && occupied >= max;
  const spotsLeft = max == null ? null : Math.max(max - occupied, 0);
  const fillRatio =
    max == null || max <= 0 ? null : Math.min(Math.max(occupied / max, 0), 1);

  const time = formatEventTime(event.eventDate);
  const duration =
    event.durationMinutes > 0 ? formatDurationLabel(event.durationMinutes) : "";
  const badge = relativeEventBadge(event.eventDate);
  const sportLabel = event.sportName.trim().toLocaleUpperCase("tr-TR");
  const title = event.title.trim() || "Etkinlik";
  const place = event.location.trim();
  const showPlace = place.length > 0 && place !== "Konum yok";
  const photo = sportImageForSlug(event.sport);
  const accent = sportAccentToken(event.sport);
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  const sportSoft = accent?.soft ?? themeColors.surface.secondary;
  const onAccent = accent?.onAccent ?? themeColors.text.inverse;

  const remainingLabel = unlimited
    ? "Sınırsız"
    : isFull
      ? "Etkinlik dolu"
      : `${spotsLeft} yer kaldı`;

  const countLabel = unlimited ? `${occupied}` : `${occupied} / ${max}`;

  const whenSpoken = badge
    ? [badge.toLocaleLowerCase("tr-TR"), time ? `saat ${time}` : null]
        .filter(Boolean)
        .join(" ")
    : event.dateLabel.trim() || null;

  const accessibilityLabel = [
    sportLabel ? `${sportLabel} etkinliği` : "Etkinlik",
    title,
    whenSpoken,
    showPlace ? place : null,
    [time, duration].filter(Boolean).join(" "),
    `${occupied} katılımcı`,
    unlimited ? "sınırsız kapasite" : `kapasite ${max} kişi`,
    remainingLabel,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 70)}
      style={[shadows.md, { borderRadius: radius.xl }]}
    >
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.985, { duration: PRESS_MS });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: PRESS_MS });
        }}
        style={[
          pressStyle,
          {
            overflow: "hidden",
            borderRadius: radius.xl,
            backgroundColor: themeColors.surface.primary,
          },
        ]}
      >
        <View
          className="min-h-[210px]"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== cardSize.width || height !== cardSize.height) {
              setCardSize({ width, height });
            }
          }}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SportPhoto
              image={photo}
              icon={event.sportIcon}
              accent={sportColor}
              soft={sportSoft}
              width={cardSize.width}
              height={cardSize.height}
            />
            <MistOverlay
              fadeId={event.id}
              width={cardSize.width}
              height={cardSize.height}
            />
          </View>

          {badge ? (
            <View
              className="absolute right-3.5 top-3.5 z-20 rounded-pill px-2.5 py-1"
              style={{ backgroundColor: sportColor }}
            >
              <Text
                className="font-body text-[10px] font-bold tracking-wide"
                style={{ color: onAccent }}
              >
                {badge}
              </Text>
            </View>
          ) : null}

          <View className="z-10 min-h-[210px] justify-between px-4 py-3.5">
            {sportLabel || event.skillLevel != null ? (
              <View className="flex-row flex-wrap items-center gap-1.5">
                {sportLabel ? (
                  <View className="flex-row items-center self-start rounded-pill bg-white/90 px-2 py-0.5">
                    <FontAwesome6
                      name={event.sportIcon}
                      size={9}
                      color={sportColor}
                    />
                    <Text
                      numberOfLines={1}
                      className="ml-1 font-body text-[10px] font-bold tracking-[1.2px]"
                      style={{ color: sportColor }}
                    >
                      {sportLabel}
                    </Text>
                  </View>
                ) : null}
                {event.skillLevel != null ? (
                  <View className="self-start rounded-pill bg-white/90 px-2 py-0.5">
                    <Text
                      numberOfLines={1}
                      className="font-body text-[10px] font-bold tracking-[0.4px] text-text-secondary"
                    >
                      {SKILL_LEVEL_LABELS[skillKeyFromCode(event.skillLevel)]}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View />
            )}

            <View>
              <View className="w-[62%] pr-2">
                <Text
                  numberOfLines={2}
                  className="font-display text-[22px] leading-7 text-text-primary"
                >
                  {title}
                </Text>

                <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
                  {showPlace ? (
                    <MetaItem icon="location-dot" label={place} />
                  ) : null}
                  {time ? <MetaItem icon="clock" label={time} /> : null}
                </View>
                {duration ? (
                  <View className="mt-0.5">
                    <MetaItem icon="clock" label={duration} />
                  </View>
                ) : null}
              </View>

              <View className="mt-3 flex-row items-end justify-between gap-3">
                <View className="w-[40%]">
                  <ParticipantProof
                    occupied={occupied}
                    soft={sportSoft}
                    accent={isFull ? themeColors.warning : sportColor}
                  />
                  {fillRatio != null ? (
                    <View
                      className="mt-1.5 h-[4px] overflow-hidden rounded-full"
                      style={{ backgroundColor: themeColors.border.default }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${fillRatio * 100}%`,
                          backgroundColor: sportColor,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text className="font-body-bold text-[18px] leading-6 text-text-primary">
                    {countLabel}
                  </Text>
                  <Text
                    className="mt-0.5 font-body text-caption"
                    style={{
                      color: isFull
                        ? themeColors.warning
                        : themeColors.text.secondary,
                    }}
                  >
                    {remainingLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function MetaItem({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <FontAwesome6 name={icon} size={10} color={themeColors.text.secondary} />
      <Text
        numberOfLines={1}
        className="max-w-[140px] font-body text-[12px] text-text-secondary"
      >
        {label}
      </Text>
    </View>
  );
}

function MistOverlay({
  fadeId,
  width,
  height,
}: {
  fadeId: string;
  width: number;
  height: number;
}) {
  const radialLeftId = `mist-radial-left-${fadeId}`;
  const radialRightId = `mist-radial-right-${fadeId}`;
  const leftId = `mist-left-${fadeId}`;
  const bottomId = `mist-bottom-${fadeId}`;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient
            id={radialLeftId}
            cx="12%"
            cy="78%"
            rx="72%"
            ry="108%"
            fx="12%"
            fy="78%"
          >
            <Stop offset="0" stopColor={MIST} stopOpacity="0.94" />
            <Stop offset="0.35" stopColor={MIST} stopOpacity="0.62" />
            <Stop offset="0.62" stopColor={MIST} stopOpacity="0.02" />
            <Stop offset="1" stopColor={MIST} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id={radialRightId}
            cx="92%"
            cy="92%"
            rx="36%"
            ry="64%"
            fx="92%"
            fy="92%"
          >
            <Stop offset="0" stopColor={MIST} stopOpacity="0.9" />
            <Stop offset="0.45" stopColor={MIST} stopOpacity="0.48" />
            <Stop offset="0.78" stopColor={MIST} stopOpacity="0.1" />
            <Stop offset="1" stopColor={MIST} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={leftId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={MIST} stopOpacity="0.68" />
            <Stop offset="0.28" stopColor={MIST} stopOpacity="0.18" />
            <Stop offset="0.5" stopColor={MIST} stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id={bottomId} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={MIST} stopOpacity="0.28" />
            <Stop offset="0.1" stopColor={MIST} stopOpacity="0.48" />
            <Stop offset="0.22" stopColor={MIST} stopOpacity="0.12" />
            <Stop offset="0.32" stopColor={MIST} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${leftId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${bottomId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${radialLeftId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${radialRightId})`}
        />
      </Svg>
    </View>
  );
}

function SportPhoto({
  image,
  icon,
  accent,
  soft,
  width,
  height,
}: {
  image: ReturnType<typeof sportImageForSlug>;
  icon: IconName;
  accent: string;
  soft: string;
  width: number;
  height: number;
}) {
  if (image) {
    if (width <= 0 || height <= 0) {
      return null;
    }

    return (
      <Image
        source={image}
        resizeMode="cover"
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

  return (
    <View
      className="items-center justify-center"
      style={[StyleSheet.absoluteFill, { backgroundColor: soft }]}
    >
      <View
        pointerEvents="none"
        className="absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-35"
        style={{ backgroundColor: accent }}
      />
      <FontAwesome6 name={icon} size={40} color={accent} />
    </View>
  );
}

function ParticipantProof({
  occupied,
  soft,
  accent,
}: {
  occupied: number;
  soft: string;
  accent: string;
}) {
  const shown = occupied === 0 ? 1 : Math.min(occupied, 3);
  const extra = Math.max(occupied - 3, 0);

  return (
    <View className="flex-row items-center">
      {Array.from({ length: shown }, (_, index) => (
        <View
          key={index}
          className="h-8 w-8 items-center justify-center rounded-full border-2 border-white"
          style={{
            marginLeft: index === 0 ? 0 : -10,
            backgroundColor: soft,
            zIndex: shown - index,
          }}
        >
          {index === 0 ? (
            <FontAwesome6 name="user-group" size={11} color={accent} />
          ) : null}
        </View>
      ))}
      {extra > 0 ? (
        <View className="ml-1.5 h-8 min-w-8 items-center justify-center rounded-full border border-white bg-white px-2">
          <Text className="font-body text-[11px] font-semibold text-text-primary">
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
