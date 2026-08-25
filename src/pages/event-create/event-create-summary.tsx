import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

import { DURATION_OPTIONS } from "@/constants/events";
import type { IconName } from "@/types/components";
import type { CreateEventFormValues } from "@/types/events";
import type { SportCategory } from "@/types/sports";

type EventCreateSummaryProps = {
  values: CreateEventFormValues;
  sportOptions: SportCategory[];
};

function formatSummaryDate(date: Date) {
  const day = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${day} · ${time}`;
}

function compactLocation(address: string) {
  const trimmed = address.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.split(",")[0]?.trim() || trimmed;
}

function SummaryRow({
  icon,
  children,
}: {
  icon: IconName;
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <FontAwesome6 name={icon} size={12} color="#ccff00" />
      <Text
        className="flex-1 font-body text-sm text-brand-neutral"
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

export function EventCreateSummary({
  values,
  sportOptions,
}: EventCreateSummaryProps) {
  const sport = sportOptions.find((option) => option.key === values.sportSlug);
  const title = values.title.trim();
  const location = compactLocation(values.addressText);
  const duration =
    DURATION_OPTIONS.find((option) => option.minutes === values.durationMinutes)
      ?.label ??
    (values.durationMinutes > 0 ? `${values.durationMinutes} dk` : null);
  const dateLabel = formatSummaryDate(values.eventDate);
  const playerCount = Number(values.maxPlayers);
  const playersLabel = Number.isFinite(playerCount)
    ? `${playerCount} kişi`
    : null;
  const schedule = [dateLabel, duration].filter(Boolean).join("   •   ");

  return (
    <View>
      <Text className="mb-2 font-body text-sm text-brand-neutral">
        Etkinlik Özeti
      </Text>

      <View className="rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5">
        {sport ? (
          <View className="flex-row items-center gap-2.5">
            <FontAwesome6 name={sport.icon} size={14} color="#ccff00" />
            <Text className="font-body text-sm text-white" numberOfLines={1}>
              {sport.label}
            </Text>
          </View>
        ) : null}

        {title ? (
          <Text
            className={`font-display text-lg text-white ${sport ? "mt-1" : ""}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}

        {location || schedule || playersLabel ? (
          <View className={`gap-2 ${sport || title ? "mt-3" : ""}`}>
            {location ? (
              <SummaryRow icon="location-dot">{location}</SummaryRow>
            ) : null}
            {schedule ? (
              <SummaryRow icon="calendar-days">{schedule}</SummaryRow>
            ) : null}
            {playersLabel ? (
              <SummaryRow icon="users">{playersLabel}</SummaryRow>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
