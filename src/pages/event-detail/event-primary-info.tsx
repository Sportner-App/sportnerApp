import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components";
import { skillKeyFromCode, useSkillLevelLabels } from "@/constants/profile";
import { sportAccentToken, themeColors, typeStyles } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventDetail, EventParticipant } from "@/types/events";
import { PARTICIPANT_STATUS } from "@/types/events";
import {
  formatDurationLabel,
  formatEventFee,
  formatEventTime,
  isCurrentParticipant,
  noLocationLabel,
} from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

import { InboxRow } from "./inbox-row";
import { AppText as Text } from "@/components/app-text";

type EventPrimaryInfoProps = {
  event: EventDetail;
  isOrganizer?: boolean;
  /** Blok doğrudan etkinlik fotoğrafının üzerinde duruyor: metne gölge, ayırıcılara
   * saydam beyaz tonlar verip kontrastı fotoğraftan bağımsız hale getiriyoruz. */
  onMedia?: boolean;
  onOpenParticipants?: () => void;
  onOpenReviews?: () => void;
};

const VISIBLE_AVATARS = 3;

const MEDIA_TEXT_SHADOW = {
  textShadowColor: "rgba(2, 8, 13, 0.6)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

export function EventPrimaryInfo({
  event,
  isOrganizer,
  onMedia = false,
  onOpenParticipants,
  onOpenReviews,
}: EventPrimaryInfoProps) {
  const { t } = useTranslation("eventDetail");
  const SKILL_LEVEL_LABELS = useSkillLevelLabels();
  const title = event.title.trim() || t("events:fallback.event");
  const time = formatEventTime(event.eventDate);
  const duration =
    event.durationMinutes > 0
      ? event.durationLabel || formatDurationLabel(event.durationMinutes)
      : "";
  const place = event.location.trim();
  const showPlace = place.length > 0 && place !== noLocationLabel();

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(80)}
      className="gap-md"
    >
      <Text
        numberOfLines={3}
        style={[
          typeStyles.headingLarge,
          { color: themeColors.text.primary },
          onMedia ? MEDIA_TEXT_SHADOW : null,
        ]}
      >
        {title}
      </Text>

      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        {showPlace ? (
          <MetaPiece icon="location-dot" label={place} onMedia={onMedia} />
        ) : null}
        {showPlace && time ? <MetaDot onMedia={onMedia} /> : null}
        {time ? (
          <MetaPiece icon="clock" label={time} onMedia={onMedia} />
        ) : null}
        {(showPlace || time) && duration ? <MetaDot onMedia={onMedia} /> : null}
        {duration ? (
          <MetaPiece icon="clock" label={duration} onMedia={onMedia} />
        ) : null}
        {showPlace || time || duration ? <MetaDot onMedia={onMedia} /> : null}
        <MetaPiece
          icon="id-card"
          onMedia={onMedia}
          label={t("primaryInfo.ageRange", {
            min: event.minParticipantAge,
            max: event.maxParticipantAge,
          })}
        />
        {event.participantGender != null ? (
          <>
            <MetaDot onMedia={onMedia} />
            <MetaPiece
              icon="venus-mars"
              onMedia={onMedia}
              label={t(
                event.participantGender === 1
                  ? "primaryInfo.womenOnly"
                  : "primaryInfo.menOnly",
              )}
            />
          </>
        ) : null}
        {event.skillLevel != null ? (
          <>
            <MetaDot onMedia={onMedia} />
            <MetaPiece
              icon="medal"
              onMedia={onMedia}
              label={SKILL_LEVEL_LABELS[skillKeyFromCode(event.skillLevel)]}
            />
          </>
        ) : null}
        <MetaDot onMedia={onMedia} />
        <MetaPiece
          icon="coins"
          onMedia={onMedia}
          label={formatEventFee(event.isPaid, event.feeAmount)}
        />
      </View>

      {event.organizationName ? (
        <View className="flex-row items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 self-start px-3 py-1.5">
          <FontAwesome6 name="users" size={10} color="#ccff00" />
          <Text className="font-body-bold text-caption text-text-primary">
            {event.organizationName}
          </Text>
        </View>
      ) : null}

      {event.isPaid ? (
        <Text
          className="font-body text-caption leading-5"
          style={{
            color: onMedia
              ? themeColors.text.secondary
              : themeColors.text.tertiary,
          }}
        >
          {t("primaryInfo.paymentDisclaimer")}
        </Text>
      ) : null}

      <EventCapacitySummary
        event={event}
        isOrganizer={isOrganizer}
        onMedia={onMedia}
        onOpenParticipants={onOpenParticipants}
        onOpenReviews={onOpenReviews}
      />
    </Animated.View>
  );
}

function MetaDot({ onMedia = false }: { onMedia?: boolean }) {
  return (
    <Text
      className="font-body text-caption"
      style={{
        color: onMedia ? themeColors.text.secondary : themeColors.text.tertiary,
      }}
    >
      ·
    </Text>
  );
}

function MetaPiece({
  icon,
  label,
  onMedia = false,
}: {
  icon: IconName;
  label: string;
  onMedia?: boolean;
}) {
  const muted = onMedia ? themeColors.text.primary : themeColors.text.secondary;

  return (
    <View className="flex-row items-center gap-1.5">
      <FontAwesome6 name={icon} size={11} color={muted} />
      <Text
        numberOfLines={1}
        className="max-w-[220px] font-body text-label"
        style={[{ color: muted }, onMedia ? MEDIA_TEXT_SHADOW : null]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EventCapacitySummary({
  event,
  isOrganizer,
  onMedia = false,
  onOpenParticipants,
  onOpenReviews,
}: EventPrimaryInfoProps) {
  const { t } = useTranslation("eventDetail");
  const canRate =
    !isOrganizer && event.myParticipationStatus === PARTICIPANT_STATUS.attended;
  const max = event.maxParticipants;
  const occupied = Math.max(event.participantCount, 0);
  const unlimited = max == null;
  const isFull = max != null && max > 0 && occupied >= max;
  const spotsLeft = max == null ? null : Math.max(max - occupied, 0);
  const fillRatio =
    max == null || max <= 0 ? null : Math.min(Math.max(occupied / max, 0), 1);
  const people = event.participants.filter((item) =>
    isCurrentParticipant(item.status),
  );
  const visible = people.slice(0, VISIBLE_AVATARS);
  const extra = Math.max(people.length - visible.length, 0);
  const guestCount = people.filter((person) => person.isGuest).length;
  const accent = sportAccentToken(event.sport);
  const sportSoft = accent?.soft ?? themeColors.surface.secondary;
  const sportColor = accent?.accent ?? themeColors.text.secondary;
  // Fotoğraf üzerinde koyu lacivert halka/şerit kaybolur; saydam beyaza çeviriyoruz.
  const ringColor = onMedia
    ? "rgba(255, 255, 255, 0.4)"
    : themeColors.surface.primary;
  const trackColor = onMedia
    ? "rgba(255, 255, 255, 0.22)"
    : themeColors.border.default;

  const remainingLabel = unlimited
    ? t("primaryInfo.unlimited")
    : isFull
      ? t("primaryInfo.full")
      : t("primaryInfo.spotsLeft", { count: spotsLeft ?? 0 });

  const countLabel = unlimited
    ? t("primaryInfo.countLabel", { count: occupied })
    : t("primaryInfo.countLabelWithMax", { count: occupied, max });

  return (
    <View className="mt-sm gap-sm">
      <Pressable
        disabled={!onOpenParticipants}
        onPress={() => {
          lightImpact();
          onOpenParticipants?.();
        }}
        className="flex-row items-end justify-between gap-3 active:opacity-70"
      >
        <View className="min-h-10 flex-1 flex-row items-center">
          {visible.length > 0 ? (
            <>
              {visible.map((person, index) => (
                <CapacityAvatar
                  key={person.id}
                  person={person}
                  index={index}
                  soft={sportSoft}
                  accent={sportColor}
                  ring={ringColor}
                />
              ))}
              {extra > 0 ? (
                <View
                  className="h-10 w-10 items-center justify-center rounded-full border-2"
                  style={{
                    marginLeft: -10,
                    backgroundColor: themeColors.surface.secondary,
                    borderColor: ringColor,
                    zIndex: 0,
                  }}
                >
                  <Text
                    className="font-body-bold text-overline"
                    style={{ color: themeColors.text.primary }}
                  >
                    +{extra}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: sportSoft }}
            >
              <FontAwesome6 name="user-group" size={13} color={sportColor} />
            </View>
          )}
        </View>

        <View className="items-end">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-body-bold text-heading-sm leading-6 text-text-primary"
              style={onMedia ? MEDIA_TEXT_SHADOW : undefined}
            >
              {countLabel}
            </Text>
            {onOpenParticipants ? (
              <FontAwesome6
                name="chevron-right"
                size={10}
                color={themeColors.text.tertiary}
              />
            ) : null}
          </View>
          <Text
            className="mt-0.5 font-body text-caption"
            style={[
              {
                color: isFull
                  ? themeColors.warning
                  : onMedia
                    ? themeColors.text.primary
                    : themeColors.text.secondary,
              },
              onMedia ? MEDIA_TEXT_SHADOW : null,
            ]}
          >
            {remainingLabel}
          </Text>
        </View>
      </Pressable>

      {fillRatio != null ? (
        <View
          className="h-[4px] overflow-hidden rounded-full"
          style={{ backgroundColor: trackColor }}
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

      {guestCount > 0 ? (
        <View
          className="self-start flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: sportSoft }}
        >
          <FontAwesome6 name="user" size={9} color={sportColor} />
          <Text
            className="font-body-bold text-overline"
            style={{ color: sportColor }}
          >
            {t("primaryInfo.guestCount", { count: guestCount })}
          </Text>
        </View>
      ) : null}

      {onOpenReviews && canRate ? (
        <InboxRow
          icon="star"
          title={t("primaryInfo.reviewPrompt.title")}
          subtitle={t("primaryInfo.reviewPrompt.subtitle")}
          accentBackground={sportSoft}
          accentColor={sportColor}
          onPress={onOpenReviews}
        />
      ) : onOpenReviews ? (
        <Pressable onPress={onOpenReviews} className="self-start py-1">
          <Text
            className="font-body text-caption"
            style={[
              { color: themeColors.text.secondary },
              onMedia ? MEDIA_TEXT_SHADOW : null,
            ]}
          >
            {t("primaryInfo.reviews")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CapacityAvatar({
  person,
  index,
  soft,
  accent,
  ring,
}: {
  person: EventParticipant;
  index: number;
  soft: string;
  accent: string;
  ring: string;
}) {
  const face = (
    <Avatar
      uri={person.avatarUrl}
      name={person.name}
      isGuest={person.isGuest}
      size={36}
      borderWidth={0}
      backgroundColor={soft}
      textColor={accent}
    />
  );

  const shellStyle = {
    marginLeft: index === 0 ? 0 : -10,
    backgroundColor: soft,
    borderColor: ring,
    zIndex: VISIBLE_AVATARS - index,
  };

  return (
    <View
      style={shellStyle}
      className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2"
    >
      {face}
    </View>
  );
}
