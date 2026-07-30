/**
 * Onboarding flow constants
 */

import type { SkillLevel } from "@/features/onboarding/model/types";

export const SPORT_OPTIONS = [
  { key: "basketball", label: "Basketbol" },
  { key: "football", label: "Futbol" },
  { key: "tennis", label: "Tenis" },
  { key: "volleyball", label: "Voleybol" },
  { key: "running", label: "Koşu" },
  { key: "fitness", label: "Fitness" },
];

export const LEVEL_OPTIONS: { key: SkillLevel; label: string }[] = [
  { key: "beginner", label: "Başlangıç" },
  { key: "intermediate", label: "Orta" },
  { key: "advanced", label: "İleri" },
];
