import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText as Text, Chip } from "@/components";
import {
  skillKeyFromCode,
  useSkillLevelLabels,
} from "@/features/sports/skill-levels";
import { resolveEventPhoto } from "@/features/sports/sport-images";
import {
  radius,
  shadows,
  sportAccentToken,
  themeColors,
} from "@/constants/theme";
import type { EventSummary } from "@/features/events/types";
import {
  formatDurationLabel,
  formatEventFee,
  noLocationLabel,
  relativeEventBadge,
} from "@/features/events/format";
import {
  hasApprovedParticipation,
  hasEventEnded,
  hasPendingParticipation,
} from "@/features/events/status";
import { formatClockTime } from "@/utils/date-format";
import { getCurrentLocale } from "@/i18n";
import {
  MetaItem,
  MistOverlay,
  SportPhoto,
  ParticipantProof,
} from "./event-card-parts";

type EventCardProps = {
  event: EventSummary;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_MS = 120;
export function EventCard({ event, onPress }: EventCardProps) {
  const { t } = useTranslation("home");
  const SKILL_LEVEL_LABELS = useSkillLevelLabels();
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

  const time = formatClockTime(event.eventDate);
  const duration =
    event.durationMinutes != null && event.durationMinutes > 0
      ? formatDurationLabel(event.durationMinutes)
      : "";
  const isEnded = hasEventEnded(event);
  const badge = isEnded
    ? t("eventCard.ended")
    : relativeEventBadge(event.eventDate);
  const sportLabel = event.sportName.trim();
  const title = event.title.trim() || t("eventCard.untitled");
  const place = event.location.trim();
  const showPlace = place.length > 0 && place !== noLocationLabel();
  const photo = resolveEventPhoto(event.sportCoverImageUrl);
  const accent = sportAccentToken(event.sport);
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  const sportSoft = accent?.soft ?? themeColors.surface.secondary;
  // Seviye ve ücret rozet değil, meta satırında düz metin.
  const detailLine = [
    event.skillLevel != null
      ? SKILL_LEVEL_LABELS[skillKeyFromCode(event.skillLevel)]
      : null,
    formatEventFee(event.isPaid, event.feeAmount),
  ]
    .filter(Boolean)
    .join(" · ");

  // Kullanıcının bu etkinlikteki katılım durumu (katılımcı / onay bekliyor).
  const myStatus = event.myParticipationStatus;
  const myStatusBadge = isEnded
    ? null
    : hasApprovedParticipation(myStatus)
      ? {
          label: t("eventCard.myStatus.approved"),
          accessibilityLabel: t("eventCard.accessibility.myStatusApproved"),
          color: themeColors.success,
          icon: "circle-check" as const,
        }
      : hasPendingParticipation(myStatus)
        ? {
            label: t("eventCard.myStatus.pending"),
            accessibilityLabel: t("eventCard.accessibility.myStatusPending"),
            color: themeColors.warning,
            icon: "clock" as const,
          }
        : null;

  const remainingLabel = isEnded
    ? t("eventCard.ended")
    : unlimited
      ? t("eventCard.unlimited")
      : isFull
        ? t("eventCard.full")
        : t("eventCard.spotsLeft", { count: spotsLeft ?? 0 });

  const countLabel = unlimited ? `${occupied}` : `${occupied} / ${max}`;

  const whenSpoken = badge
    ? [
        badge.toLocaleLowerCase(getCurrentLocale()),
        time ? t("eventCard.atTime", { time }) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : event.dateLabel.trim() || null;

  const accessibilityLabel = [
    sportLabel
      ? t("eventCard.accessibility.sportEvent", { sport: sportLabel })
      : t("eventCard.accessibility.defaultEvent"),
    title,
    whenSpoken,
    showPlace ? place : null,
    [time, duration].filter(Boolean).join(" "),
    t("eventCard.accessibility.participantCount", { count: occupied }),
    unlimited
      ? t("eventCard.accessibility.unlimitedCapacity")
      : t("eventCard.accessibility.capacity", { count: max }),
    isEnded ? t("eventCard.accessibility.ended") : remainingLabel,
    myStatusBadge?.accessibilityLabel ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={[shadows.md, { borderRadius: radius.xl }]}>
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
              width={cardSize.width}
              height={cardSize.height}
            />
            <MistOverlay
              fadeId={event.id}
              width={cardSize.width}
              height={cardSize.height}
            />
            {isEnded ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(3, 10, 18, 0.38)" },
                ]}
              />
            ) : null}
          </View>

          {badge ? (
            <Chip
              label={badge}
              icon={isEnded ? "check" : undefined}
              className="absolute right-3.5 top-3.5 z-20"
            />
          ) : null}

          <View className="z-10 min-h-[210px] justify-between px-4 py-3.5">
            {sportLabel ? (
              <Chip
                variant="sport"
                sport={event.sport}
                icon={event.sportIcon}
                label={sportLabel}
                className="mb-3"
              />
            ) : (
              <View />
            )}

            <View>
              <View className="w-[62%] pr-2">
                <Text
                  numberOfLines={2}
                  className="font-display text-heading-sm leading-6 text-white"
                >
                  {title}
                </Text>

                <View className="mt-2 gap-1">
                  {showPlace ? (
                    <MetaItem
                      icon="location-dot"
                      label={place}
                      accent={sportColor}
                    />
                  ) : null}
                  <MetaItem
                    icon="calendar-day"
                    label={
                      duration
                        ? `${event.dateLabel} · ${duration}`
                        : event.dateLabel
                    }
                    accent={sportColor}
                  />
                  {detailLine ? (
                    <Text
                      numberOfLines={1}
                      className="font-body text-label text-white/80"
                    >
                      {detailLine}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="mt-3 flex-row items-end justify-between gap-3">
                <View className="flex-1">
                  <ParticipantProof
                    occupied={occupied}
                    avatars={event.participantAvatars}
                    soft={sportSoft}
                    accent={isFull ? themeColors.warning : sportColor}
                  />
                  {fillRatio != null || myStatusBadge ? (
                    <View className="mt-1.5 flex-row items-center gap-1.5">
                      {fillRatio != null ? (
                        <View
                          className="h-[4px] flex-1 overflow-hidden rounded-full"
                          style={{
                            backgroundColor: themeColors.border.default,
                          }}
                        >
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${fillRatio * 100}%`,
                              backgroundColor: isEnded
                                ? themeColors.icon.muted
                                : sportColor,
                            }}
                          />
                        </View>
                      ) : null}
                      {myStatusBadge ? (
                        <View className="flex-row items-center gap-1">
                          <FontAwesome6
                            name={myStatusBadge.icon}
                            size={11}
                            color={myStatusBadge.color}
                          />
                          <Text
                            className="font-body-bold text-caption"
                            style={{ color: myStatusBadge.color }}
                          >
                            {myStatusBadge.label}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text className="font-body-bold text-heading-sm leading-6 text-white">
                    {countLabel}
                  </Text>
                  <Text
                    className="mt-0.5 font-body text-caption"
                    style={{
                      color: isEnded
                        ? themeColors.icon.subtle
                        : isFull
                          ? themeColors.warning
                          : themeColors.icon.soft,
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
    </View>
  );
}
