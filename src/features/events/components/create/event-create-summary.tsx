import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { shortLocation } from "@/features/events/address";
import { useDurationOptions } from "@/features/events/copy";
import {
  skillKeyFromCode,
  useSkillLevelLabels,
} from "@/features/sports/skill-levels";
import {
  formatAgeRange,
  formatEventFee,
  parseFeeAmount,
} from "@/features/events/format";
import { sportAccentToken, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import type { CreateEventFormValues } from "@/features/events/types";
import type { SportOption } from "@/features/sports/types";
import { getCurrentLocale } from "@/i18n";
import { AppText as Text, Chip } from "@/components";
import { resolveEventPhoto } from "@/features/sports/sport-images";
import {
  MetaItem,
  MistOverlay,
  SportPhoto,
} from "@/features/events/components/event-card-parts";

type EventCreateSummaryProps = {
  values: CreateEventFormValues;
  sportOptions: SportOption[];
};

function formatSummaryDate(date: Date) {
  const locale = getCurrentLocale();
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

function SummaryPill({
  icon,
  label,
  accent,
}: {
  icon: IconName;
  label: string;
  accent: string;
}) {
  return (
    <View className="max-w-full flex-row items-center gap-1.5 rounded-full border border-border-default bg-surface-secondary px-3 py-1.5">
      <FontAwesome6 name={icon} size={11} color={accent} />
      <Text
        numberOfLines={1}
        className="shrink font-body-bold text-caption text-text-secondary"
      >
        {label}
      </Text>
    </View>
  );
}

export function EventCreateSummary({
  values,
  sportOptions,
}: EventCreateSummaryProps) {
  const { t } = useTranslation("eventCreate");
  const [photoSize, setPhotoSize] = useState({ width: 0, height: 0 });
  const SKILL_LEVEL_LABELS = useSkillLevelLabels();
  const DURATION_OPTIONS = useDurationOptions();
  const sport = sportOptions.find((option) => option.key === values.sportSlug);
  const sportToken = sportAccentToken(values.sportSlug);
  const accent = sportToken?.accent ?? themeColors.brand.primary;
  const title = values.title.trim();
  const location = values.addressText.trim()
    ? shortLocation(values.addressText)
    : null;
  const duration =
    DURATION_OPTIONS.find((option) => option.minutes === values.durationMinutes)
      ?.label ??
    (values.durationMinutes != null && values.durationMinutes > 0
      ? t("duration.minutesShort", { count: values.durationMinutes })
      : null);
  const dateLabel = formatSummaryDate(values.eventDate);
  const playerCount = Number(values.maxPlayers);
  const playersLabel = values.isUnlimitedPlayers
    ? t("summary.playersUnlimited")
    : Number.isFinite(playerCount)
      ? t("summary.playersLabel", { count: playerCount })
      : null;
  const schedule = [dateLabel, duration].filter(Boolean).join("   •   ");

  const gender =
    values.participantGender === 1
      ? t("participantGender.womenOnly")
      : values.participantGender === 2
        ? t("participantGender.menOnly")
        : t("participantGender.everyone");
  const ageLabel = values.hasAgeRestriction
    ? formatAgeRange(
        Number(values.minParticipantAge),
        Number(values.maxParticipantAge),
      )
    : formatAgeRange(null, null);
  const feeLabel = formatEventFee(
    values.isPaid,
    values.isPaid ? parseFeeAmount(values.feeAmountText) : null,
  );

  return (
    <View>
      <Text className="mb-2 font-body-bold text-label text-text-secondary">
        {t("summary.heading")}
      </Text>

      <View className="overflow-hidden rounded-[24px] border border-border-default bg-surface-primary">
        {/* Yayınlanınca listede görünecek kartın aynısı: fotoğraf ve sis. */}
        <View
          className="min-h-[190px] justify-between px-4 py-3.5"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== photoSize.width || height !== photoSize.height) {
              setPhotoSize({ width, height });
            }
          }}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SportPhoto
              image={resolveEventPhoto(sport?.coverImageUrl)}
              width={photoSize.width}
              height={photoSize.height}
            />
            <MistOverlay
              fadeId="create-summary"
              width={photoSize.width}
              height={photoSize.height}
            />
          </View>

          {sport ? (
            <Chip
              variant="sport"
              sport={values.sportSlug}
              icon={sport.icon}
              label={sport.label}
              className="mb-3"
            />
          ) : (
            <View />
          )}

          <View className="w-[72%] gap-2">
            {title ? (
              <Text
                numberOfLines={2}
                className="font-display text-heading-sm leading-6 text-white"
              >
                {title}
              </Text>
            ) : null}
            <View className="gap-1">
              {location ? (
                <MetaItem icon="location-dot" label={location} accent={accent} />
              ) : null}
              <MetaItem icon="calendar-day" label={schedule} accent={accent} />
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 p-3">
          {playersLabel ? (
            <SummaryPill icon="users" accent={accent} label={playersLabel} />
          ) : null}
          <SummaryPill icon="id-card" accent={accent} label={ageLabel} />
          <SummaryPill icon="venus-mars" accent={accent} label={gender} />
          {values.skillLevel != null ? (
            <SummaryPill
              icon="medal"
              accent={accent}
              label={SKILL_LEVEL_LABELS[skillKeyFromCode(values.skillLevel)]}
            />
          ) : null}
          <SummaryPill icon="coins" accent={accent} label={feeLabel} />
          {values.isRecurring ? (
            <SummaryPill
              icon="repeat"
              accent={accent}
              label={[
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
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
