import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

import { DURATION_OPTIONS } from "@/constants/events";
import { SKILL_LEVEL_LABELS, skillKeyFromCode } from "@/constants/profile";
import { sportAccentToken, themeColors } from "@/constants/theme";
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
  accent,
}: {
  icon: IconName;
  children: string;
  accent: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <FontAwesome6 name={icon} size={12} color={accent} />
      <Text
        className="flex-1 font-body text-sm text-text-secondary"
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
  const sportToken = sportAccentToken(values.sportSlug);
  const accent = sportToken?.accent ?? themeColors.brand.primary;
  const soft = sportToken?.soft ?? themeColors.surface.secondary;
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
      <Text className="mb-2 font-body-bold text-[13px] text-text-secondary">
        Etkinlik Özeti
      </Text>

      <View className="rounded-[24px] border border-border-default bg-surface-primary px-4 py-4">
        {sport ? (
          <View className="flex-row items-center gap-2.5">
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: soft }}
            >
              <FontAwesome6 name={sport.icon} size={14} color={accent} />
            </View>
            <Text
              className="font-body-bold text-sm text-text-primary"
              numberOfLines={1}
            >
              {sport.label}
            </Text>
          </View>
        ) : null}

        {title ? (
          <Text
            className={`font-display text-lg text-text-primary ${sport ? "mt-2" : ""}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}

        {location || schedule || playersLabel ? (
          <View className={`gap-2 ${sport || title ? "mt-3" : ""}`}>
            {location ? (
              <SummaryRow icon="location-dot" accent={accent}>
                {location}
              </SummaryRow>
            ) : null}
            {schedule ? (
              <SummaryRow icon="calendar-days" accent={accent}>
                {schedule}
              </SummaryRow>
            ) : null}
            {playersLabel ? (
              <SummaryRow icon="users" accent={accent}>
                {playersLabel}
              </SummaryRow>
            ) : null}
            <SummaryRow icon="id-card" accent={accent}>
              {`${values.minParticipantAge}–${values.maxParticipantAge} yaş`}
            </SummaryRow>
            {values.isRecurring ? (
              <SummaryRow icon="repeat" accent={accent}>
                {`${values.recurrenceCount} etkinlik · ${values.recurrenceIntervalWeeks === 1 ? "her hafta" : `${values.recurrenceIntervalWeeks} haftada bir`}`}
              </SummaryRow>
            ) : null}
            {values.skillLevel != null ? (
              <SummaryRow icon="medal" accent={accent}>
                {SKILL_LEVEL_LABELS[skillKeyFromCode(values.skillLevel)]}
              </SummaryRow>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
