import { useTranslation } from "react-i18next";

import type { SportOption } from "@/types/sports";

/** Home filter chips — slug'lar backend seed ile uyumlu */
/** Fallback create options (API sporları yüklenene kadar) */
export const CREATE_SPORT_OPTIONS: SportOption[] = [
  { key: "futbol", label: "Futbol", icon: "futbol" },
  { key: "basketbol", label: "Basketbol", icon: "basketball" },
  { key: "voleybol", label: "Voleybol", icon: "volleyball" },
  { key: "tenis", label: "Tenis", icon: "table-tennis-paddle-ball" },
  { key: "kosu", label: "Koşu", icon: "person-running" },
];

/** Adım başlıkları/kopyaları — dil değiştiğinde yeniden çözülsün diye hook. */
export function useCreateEventSteps() {
  const { t } = useTranslation("eventCreate");

  return {
    1: { title: t("steps.1.title"), subtitle: t("steps.1.subtitle") },
    2: { title: t("steps.2.title"), subtitle: t("steps.2.subtitle") },
    3: { title: t("steps.3.title"), subtitle: t("steps.3.subtitle") },
    4: { title: t("steps.4.title"), subtitle: t("steps.4.subtitle") },
  } as const;
}

export function useCreateEventCopy() {
  const { t } = useTranslation("eventCreate");
  const steps = useCreateEventSteps();

  return {
    header: t("header"),
    title: steps[1].title,
    subtitle: steps[1].subtitle,
    submit: t("submit"),
    publishing: t("publishing"),
    continue: t("continue"),
    back: t("back"),
  } as const;
}

export const DEFAULT_EVENT_DURATION_MINUTES = 90;
export const DEFAULT_EVENT_MIN_AGE = 18;
export const DEFAULT_EVENT_MAX_AGE = 60;

export type DurationOption = { key: string; label: string; minutes: number };

/** Backend: DurationMinutes > 0. Dil değiştiğinde etiketler yeniden çözülsün diye hook. */
export function useDurationOptions(): DurationOption[] {
  const { t } = useTranslation("eventCreate");

  return [
    { key: "30", label: t("duration.minutesShort", { count: 30 }), minutes: 30 },
    { key: "45", label: t("duration.minutesShort", { count: 45 }), minutes: 45 },
    { key: "60", label: t("duration.hoursShort", { count: 1 }), minutes: 60 },
    { key: "90", label: t("duration.hoursShort", { count: 1.5 }), minutes: 90 },
    { key: "120", label: t("duration.hoursShort", { count: 2 }), minutes: 120 },
    { key: "180", label: t("duration.hoursShort", { count: 3 }), minutes: 180 },
  ];
}

export const CREATE_EVENT_LIMITS = {
  titleMax: 150,
  maxParticipantsMin: 2,
  maxParticipantsMax: 1000,
  participantAgeMin: 13,
  participantAgeMax: 120,
  feeAmountMax: 99_999.99,
} as const;

export const DEFAULT_EVENT_LOCATION = {
  latitude: 40.9909,
  longitude: 29.0289,
} as const;
