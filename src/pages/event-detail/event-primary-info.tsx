import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Avatar } from "@/components";
import { sportAccentToken, themeColors, typeStyles } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { EventDetail, EventParticipant } from "@/types/events";
import {
  formatDurationLabel,
  formatEventTime,
  isCurrentParticipant,
} from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

type EventPrimaryInfoProps = {
  event: EventDetail;
  onOpenUser?: (userId: string) => void;
  onOpenReviews?: () => void;
};

const VISIBLE_AVATARS = 3;

export function EventPrimaryInfo({
  event,
  onOpenUser,
  onOpenReviews,
}: EventPrimaryInfoProps) {
  const title = event.title.trim() || "Etkinlik";
  const time = formatEventTime(event.eventDate);
  const duration =
    event.durationMinutes > 0
      ? event.durationLabel || formatDurationLabel(event.durationMinutes)
      : "";
  const place = event.location.trim();
  const showPlace = place.length > 0 && place !== "Konum yok";

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(80)}
      className="gap-md"
    >
      <Text
        numberOfLines={3}
        style={[typeStyles.headingLarge, { color: themeColors.text.primary }]}
      >
        {title}
      </Text>

      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        {showPlace ? <MetaPiece icon="location-dot" label={place} /> : null}
        {showPlace && time ? <MetaDot /> : null}
        {time ? <MetaPiece icon="clock" label={time} /> : null}
        {(showPlace || time) && duration ? <MetaDot /> : null}
        {duration ? <MetaPiece icon="clock" label={duration} /> : null}
      </View>

      <EventCapacitySummary
        event={event}
        onOpenUser={onOpenUser}
        onOpenReviews={onOpenReviews}
      />
    </Animated.View>
  );
}

function MetaDot() {
  return (
    <Text
      className="font-body text-[12px]"
      style={{ color: themeColors.text.tertiary }}
    >
      ·
    </Text>
  );
}

function MetaPiece({ icon, label }: { icon: IconName; label: string }) {
  const muted = themeColors.text.secondary;

  return (
    <View className="flex-row items-center gap-1.5">
      <FontAwesome6 name={icon} size={11} color={muted} />
      <Text
        numberOfLines={1}
        className="max-w-[220px] font-body text-[13px]"
        style={{ color: muted }}
      >
        {label}
      </Text>
    </View>
  );
}

export function EventCapacitySummary({
  event,
  onOpenUser,
  onOpenReviews,
}: EventPrimaryInfoProps) {
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

  const remainingLabel = unlimited
    ? "Sınırsız"
    : isFull
      ? "Etkinlik dolu"
      : `${spotsLeft} yer kaldı`;

  const countLabel = unlimited
    ? `${occupied} kişi`
    : `${occupied} / ${max} kişi`;

  return (
    <View className="mt-sm gap-sm">
      <View className="flex-row items-end justify-between gap-3">
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
                  onPress={
                    onOpenUser && person.userId && !person.isGuest
                      ? () => onOpenUser(person.userId!)
                      : undefined
                  }
                />
              ))}
              {extra > 0 ? (
                <View
                  className="h-10 w-10 items-center justify-center rounded-full border-2"
                  style={{
                    marginLeft: -10,
                    backgroundColor: themeColors.surface.secondary,
                    borderColor: themeColors.surface.primary,
                    zIndex: 0,
                  }}
                >
                  <Text
                    className="font-body-bold text-[11px]"
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
          <Text className="font-body-bold text-[18px] leading-6 text-text-primary">
            {countLabel}
          </Text>
          <Text
            className="mt-0.5 font-body text-caption"
            style={{
              color: isFull ? themeColors.warning : themeColors.text.secondary,
            }}
          >
            {remainingLabel}
          </Text>
        </View>
      </View>

      {fillRatio != null ? (
        <View
          className="h-[4px] overflow-hidden rounded-full"
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

      {guestCount > 0 ? (
        <View
          className="self-start flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: sportSoft }}
        >
          <FontAwesome6 name="user" size={9} color={sportColor} />
          <Text
            className="font-body-bold text-[10px]"
            style={{ color: sportColor }}
          >
            {guestCount} misafir
          </Text>
        </View>
      ) : null}

      {onOpenReviews ? (
        <Pressable onPress={onOpenReviews} className="self-start py-1">
          <Text
            className="font-body text-caption"
            style={{ color: themeColors.text.secondary }}
          >
            Değerlendirmeler
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CapacityAvatar({
  person,
  index,
  soft,
  accent,
  onPress,
}: {
  person: EventParticipant;
  index: number;
  soft: string;
  accent: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
    borderColor: themeColors.surface.primary,
    zIndex: VISIBLE_AVATARS - index,
  };

  if (!onPress) {
    return (
      <View
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2"
        style={shellStyle}
      >
        {face}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 90 });
      }}
      style={[pressStyle, shellStyle]}
      className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2"
    >
      {face}
    </AnimatedPressable>
  );
}
