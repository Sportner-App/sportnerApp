import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { memo, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import type { EventFeedItem } from "@/entities/event/model/types";
import { colorPalette } from "@/shared/config/colors";
import { getSportIconName } from "@/shared/services/sports-service";
import { DynamicIcon } from "@/shared/ui/dynamic-icon";

type EventCardProps = {
  item: EventFeedItem;
  onPress?: (item: EventFeedItem) => void;
};

function getParticipantsCount(item: EventFeedItem) {
  if (typeof item.approvedParticipantsCount === "number") {
    return item.approvedParticipantsCount;
  }
  if (typeof item.approved_participants_count === "number") {
    return item.approved_participants_count;
  }

  return item.participantsCount ?? item.participants_count ?? 0;
}

function formatEventDate(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(date);
}

function formatEventTime(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRelativeDayLabel(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffDays = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Bugun";
  if (diffDays === 1) return "Yarin";

  return formatEventDate(dateValue);
}

function getSkillLabel(maxPlayers: number) {
  if (maxPlayers <= 4) {
    return "Baslangic Seviye";
  }

  if (maxPlayers <= 8) {
    return "Orta Seviye";
  }

  return "Ileri Seviye";
}

function splitSkillLabel(levelLabel: string) {
  const [first, second] = levelLabel.split(" ");
  return {
    first: first ?? levelLabel,
    second: second ?? "Seviye",
  };
}

function formatDistance(distanceKm?: number | null) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) {
    return null;
  }

  if (distanceKm < 1) {
    const meter = Math.max(1, Math.round(distanceKm * 1000));
    return `${meter} m uzaginda`;
  }

  return `${distanceKm.toFixed(1)} km uzaginda`;
}

function EventCardComponent({ item, onPress }: EventCardProps) {
  const [iconName, setIconName] = useState<string>("HelpCircle");

  useEffect(() => {
    let isMounted = true;

    const loadIconName = async () => {
      const sportType = item.sportType ?? item.sport_type;
      const name = await getSportIconName(sportType);

      if (isMounted) {
        setIconName(name);
      }
    };

    void loadIconName();

    return () => {
      isMounted = false;
    };
  }, [item.sportType, item.sport_type]);

  const participantsCount = getParticipantsCount(item);
  const maxPlayers = item.maxPlayers ?? item.max_players ?? 0;
  const availableSpots = Math.max(maxPlayers - participantsCount, 0);
  const levelLabel = getSkillLabel(maxPlayers);
  const splitLevel = splitSkillLabel(levelLabel);
  const eventDate = item.eventDate ?? item.event_date ?? "";
  const dateLabel = getRelativeDayLabel(eventDate);
  const timeLabel = formatEventTime(eventDate);
  const title =
    item.title || item.sports?.name || item.sportType || item.sport_type;
  const distanceLabel = formatDistance(item.distance_km);
  console.log(item, "şitemmsmms");
  const approvedPreview = item.approved_participants_preview ?? [];
  const stackedPreview = approvedPreview.slice(0, 3);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="mb-4 overflow-hidden rounded-[30px] border border-brand-tertiary bg-brand-surface px-4 py-4"
    >
      <View className="flex-row items-center">
        <View className="h-[64px] w-[64px] items-center justify-center rounded-[22px] border border-brand-tertiary bg-brand-raised">
          <DynamicIcon name={iconName} size={28} color={colorPalette.primary} />
        </View>

        <View className="ml-3 mr-2 flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="font-display text-[17px] text-white"
          >
            {title}
          </Text>

          <View className="flex flex-row gap-4 mt-2">
            <View>
              <Text className="mt-1 font-display text-[16px] text-brand-primary">
                {dateLabel}
              </Text>
              <Text className="font-display text-[16px] text-brand-primary">
                {timeLabel}
              </Text>
            </View>
            <View className="mt-1 flex-row items-start">
              <FontAwesome6 name="circle" size={6} color="#d6ddbe" />
              <View className="ml-1">
                <Text className="font-body text-[14px] text-[#d6ddbe]">
                  {splitLevel.first}
                </Text>
                <Text className="-mt-0.5 font-body text-[14px] text-[#d6ddbe]">
                  {splitLevel.second}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="w-[102px] items-end justify-between self-stretch py-1">
          <View className="h-10 flex-row items-center justify-end">
            {console.log(stackedPreview, "stackedPreview")}
            {stackedPreview.length > 0 ? (
              stackedPreview.map((participant, index) =>
                participant.avatar_url ? (
                  <Image
                    key={`${participant.user_id}-${index}`}
                    source={{ uri: participant.avatar_url }}
                    className={`${index === 0 ? "" : "-ml-2.5"} h-10 w-10 rounded-full border-2 border-brand-secondary`}
                  />
                ) : (
                  <View
                    key={`${participant.user_id}-${index}`}
                    className={`${index === 0 ? "" : "-ml-2.5"} h-10 w-10 items-center justify-center rounded-full border-2 border-brand-secondary bg-brand-raised`}
                  >
                    <FontAwesome6 name="user" size={14} color="#8090aa" />
                  </View>
                ),
              )
            ) : item.profiles?.avatar_url ? (
              <Image
                source={{ uri: item.profiles.avatar_url }}
                className="h-10 w-10 rounded-full border-2 border-brand-secondary"
              />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-brand-secondary bg-brand-raised">
                <FontAwesome6 name="user" size={14} color="#8090aa" />
              </View>
            )}

            <View className="-ml-2 h-9 min-w-[36px] items-center justify-center rounded-full border-[2px] border-brand-secondary bg-brand-primary px-1.5">
              <Text className="font-display text-[12px] text-brand-secondary">
                +{availableSpots}
              </Text>
            </View>
          </View>

          <View
            className={`min-w-[96px] flex-row items-center justify-center rounded-full px-3 py-2 ${
              availableSpots > 0 ? "bg-[#3f5d33]" : "bg-brand-raised"
            }`}
          >
            <FontAwesome6
              name="users"
              size={13}
              color={availableSpots > 0 ? colorPalette.primary : "#aeb9cf"}
            />
            <Text
              className={`ml-2 font-mono text-[13px] ${
                availableSpots > 0 ? "text-brand-primary" : "text-[#aeb9cf]"
              }`}
            >
              {participantsCount}/{maxPlayers}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2 px-1">
        <FontAwesome6 name="calendar" size={13} color="#76839b" />
        <Text
          numberOfLines={1}
          className="flex-1 font-body text-[12px] text-[#7988a0]"
        >
          {item.addressText ?? item.address_text}
        </Text>

        {distanceLabel ? (
          <View className="rounded-full border border-brand-tertiary bg-brand-raised px-2.5 py-1">
            <Text className="font-mono text-[10px] text-brand-primary">
              {distanceLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {!!item.description && (
        <Text
          numberOfLines={1}
          className="mt-2 px-1 font-body text-[12px] text-[#8b98ad]"
        >
          {item.description}
        </Text>
      )}
    </Pressable>
  );
}

export const EventCard = memo(EventCardComponent);
