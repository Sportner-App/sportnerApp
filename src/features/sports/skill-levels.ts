import { useTranslation } from "react-i18next";
import type { SkillLevelKey } from "@/features/profile/types";

const SKILL_BY_CODE: Record<number, SkillLevelKey> = {
  0: "beginner",
  1: "intermediate",
  2: "advanced",
  3: "expert",
  4: "professional",
};

export function skillKeyFromCode(code: number): SkillLevelKey {
  return SKILL_BY_CODE[code] ?? "beginner";
}

/** Seviye etiketleri — dil değiştiğinde yeniden çözülsün diye hook. */
export function useSkillLevelLabels(): Record<SkillLevelKey, string> {
  const { t } = useTranslation("skills");

  return {
    beginner: t("beginner"),
    intermediate: t("intermediate"),
    advanced: t("advanced"),
    expert: t("expert"),
    professional: t("professional"),
  };
}
