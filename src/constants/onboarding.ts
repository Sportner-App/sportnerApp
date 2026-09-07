import { useTranslation } from "react-i18next";

import type { IconName } from "@/types/components";
import type { SkillLevelKey } from "@/types/profile";

/** Backend search debounce; avoid firing on every keystroke. */
export const ONBOARDING_SEARCH_DEBOUNCE_MS = 400;

/** Must match backend ListActiveSportsQueryValidator.MinSearchLength. */
export const ONBOARDING_SEARCH_MIN_CHARS = 2;

/**
 * Onboarding ekranının etiket/kopya metinleri — modül düzeyinde sabit yerine
 * hook: dil değiştiğinde `t()` yeniden değerlendirilsin diye render sırasında
 * çağrılmalı.
 */
export function useOnboardingCopy() {
  const { t } = useTranslation("onboarding");

  return {
    eyebrow: t("eyebrow"),
    sports: {
      title: t("sports.title"),
      subtitle: t("sports.subtitle"),
      submit: t("sports.submit"),
      searchPlaceholder: t("sports.searchPlaceholder"),
      searchHint: t("sports.searchHint"),
      selectedEmpty: t("sports.selectedEmpty"),
      stepLabel: t("sports.stepLabel"),
      selectedCount: (count: number) =>
        t("sports.selectedCount", { count }),
      primaryBadge: t("sports.primaryBadge"),
      tapForLevel: t("sports.tapForLevel"),
      selectedHint: t("sports.selectedHint"),
      noResults: t("sports.noResults"),
      loading: t("sports.loading"),
      loadFailed: t("sports.loadFailed"),
    },
    configSheet: {
      subtitle: t("configSheet.subtitle"),
      levelLabel: t("configSheet.levelLabel"),
      primaryTitle: t("configSheet.primaryTitle"),
      primaryDescription: t("configSheet.primaryDescription"),
      confirm: t("configSheet.confirm"),
    },
    details: {
      title: t("details.title"),
      subtitle: t("details.subtitle"),
      submit: t("details.submit"),
      skip: t("details.skip"),
      stepLabel: t("details.stepLabel"),
      backAccessibility: t("details.backAccessibility"),
      bioLabel: t("details.bioLabel"),
      bioPlaceholder: t("details.bioPlaceholder"),
    },
    toasts: {
      successTitle: t("toasts.successTitle"),
      successDescription: t("toasts.successDescription"),
      saveFailed: t("toasts.saveFailed"),
      completeFailed: t("toasts.completeFailed"),
      sportRequiredTitle: t("toasts.sportRequiredTitle"),
      sportRequiredDescription: t("toasts.sportRequiredDescription"),
      permissionRequired: t("toasts.permissionRequired"),
      videoPermissionRequired: t("toasts.videoPermissionRequired"),
      photoRequiredTitle: t("toasts.photoRequiredTitle"),
      photoRequiredDescription: t("toasts.photoRequiredDescription"),
      completeFailedTitle: t("toasts.completeFailedTitle"),
    },
  } as const;
}

export type OnboardingSkillOption = {
  key: string;
  label: string;
  shortLabel: string;
  level: number;
  skillKey: SkillLevelKey;
};

/** Seviye seçenekleri — dil değiştiğinde yeniden çözülsün diye hook. */
export function useSkillLevelOptions(): OnboardingSkillOption[] {
  const { t } = useTranslation("skills");

  return [
    { key: "0", label: t("beginner"), shortLabel: t("beginnerShort"), level: 0, skillKey: "beginner" },
    { key: "1", label: t("intermediate"), shortLabel: t("intermediateShort"), level: 1, skillKey: "intermediate" },
    { key: "2", label: t("advanced"), shortLabel: t("advancedShort"), level: 2, skillKey: "advanced" },
    { key: "3", label: t("expert"), shortLabel: t("expertShort"), level: 3, skillKey: "expert" },
    { key: "4", label: t("professional"), shortLabel: t("professionalShort"), level: 4, skillKey: "professional" },
  ];
}

/** Katalog büyüdükçe filtrelemeyi kolaylaştıran gruplar (slug bazlı). */
