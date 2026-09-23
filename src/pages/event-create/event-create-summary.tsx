import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useDurationOptions } from "@/constants/events";
import { skillKeyFromCode, useSkillLevelLabels } from "@/constants/profile";
import {
  currentDateLocale,
  formatEventFee,
  parseFeeAmount,
} from "@/utils/events";
import { sportAccentToken, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { CreateEventFormValues } from "@/types/events";
import type { SportOption } from "@/types/sports";
import { AppText as Text } from "@/components/app-text";

type EventCreateSummaryProps = {
  values: CreateEventFormValues;
  sportOptions: SportOption[];
};

function formatSummaryDate(date: Date) {
  const locale = currentDateLocale();
  const day = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString(locale, {
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
        className="flex-1 font-body text-body-sm text-text-secondary"
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
  const { t } = useTranslation("eventCreate");
  const SKILL_LEVEL_LABELS = useSkillLevelLabels();
  const DURATION_OPTIONS = useDurationOptions();
  const sport = sportOptions.find((option) => option.key === values.sportSlug);
  const sportToken = sportAccentToken(values.sportSlug);
  const accent = sportToken?.accent ?? themeColors.brand.primary;
  const soft = sportToken?.soft ?? themeColors.surface.secondary;
  const title = values.title.trim();
  const location = compactLocation(values.addressText);
  const duration =
    DURATION_OPTIONS.find((option) => option.minutes === values.durationMinutes)
      ?.label ??
    (values.durationMinutes > 0
      ? t("duration.minutesShort", { count: values.durationMinutes })
      : null);
  const dateLabel = formatSummaryDate(values.eventDate);
  const playerCount = Number(values.maxPlayers);
  const playersLabel = Number.isFinite(playerCount)
    ? t("summary.playersLabel", { count: playerCount })
    : null;
  const schedule = [dateLabel, duration].filter(Boolean).join("   •   ");

  return (
    <View>
      <Text className="mb-2 font-body-bold text-label text-text-secondary">
        {t("summary.heading")}
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
              className="font-body-bold text-body-sm text-text-primary"
              numberOfLines={1}
            >
              {sport.label}
            </Text>
          </View>
        ) : null}

        {title ? (
          <Text
            className={`font-display text-heading-sm text-text-primary ${sport ? "mt-2" : ""}`}
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
              {t("summary.ageRange", {
                min: values.minParticipantAge,
                max: values.maxParticipantAge,
              })}
            </SummaryRow>
            <SummaryRow icon="venus-mars" accent={accent}>
              {values.participantGender === 1
                ? t("participantGender.womenOnly")
                : values.participantGender === 2
                  ? t("participantGender.menOnly")
                  : t("participantGender.everyone")}
            </SummaryRow>
            {values.isRecurring ? (
              <SummaryRow icon="repeat" accent={accent}>
                {[
                  t("recurring.summarySeries", {
                    count: values.recurrenceCount,
                  }),
                  values.recurrenceIntervalWeeks === 1
                    ? t("recurring.summaryWeekly")
                    : t("recurring.summaryEveryNWeeks", {
                        weeks: values.recurrenceIntervalWeeks,
                      }),
                  t("recurring.summaryAutoOpens"),
                ].join(" · ")}
              </SummaryRow>
            ) : null}
            {values.skillLevel != null ? (
              <SummaryRow icon="medal" accent={accent}>
                {SKILL_LEVEL_LABELS[skillKeyFromCode(values.skillLevel)]}
              </SummaryRow>
            ) : null}
            <SummaryRow icon="coins" accent={accent}>
              {formatEventFee(
                values.isPaid,
                values.isPaid ? parseFeeAmount(values.feeAmountText) : null,
              )}
            </SummaryRow>
          </View>
        ) : null}
      </View>
    </View>
  );
}
