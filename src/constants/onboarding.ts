import type { IconName } from "@/types/components";
import type { SkillLevelKey } from "@/types/profile";

/** Backend search debounce; avoid firing on every keystroke. */
export const ONBOARDING_SEARCH_DEBOUNCE_MS = 400;

/** Must match backend ListActiveSportsQueryValidator.MinSearchLength. */
export const ONBOARDING_SEARCH_MIN_CHARS = 2;

export const ONBOARDING_COPY = {
  /** Üst etiket — kullanıcıya görünen adım başlığı */
  eyebrow: "PROFİL KURULUMU",
  sports: {
    title: "Sporlarını seç.",
    subtitle: "Ara, seç, seviyeni ayarla. En az bir spor ve birincil gerekli.",
    submit: "Devam Et",
    searchPlaceholder: "Spor ara…",
    searchHint: "Aramak için en az 2 harf yaz",
    selectedEmpty: "Henüz spor seçilmedi",
    stepLabel: "1 / 2",
    selectedCount: (count: number) =>
      count === 1 ? "1 spor seçildi" : `${count} spor seçildi`,
  },
  details: {
    title: "Seni\ntanıyalım.",
    subtitle: "Şehir ve kısa bio opsiyonel; istediğin zaman güncelleyebilirsin.",
    submit: "Tamamla",
    skip: "Atla ve tamamla",
    stepLabel: "2 / 2",
  },
  toasts: {
    successTitle: "Hazırsın",
    successDescription: "Profilin hazır. İyi maçlar!",
    saveFailed: "Kurulum kaydedilemedi",
    completeFailed: "Profil kurulumu tamamlanamadı",
  },
} as const;

export const ONBOARDING_SKILL_OPTIONS: {
  key: string;
  label: string;
  shortLabel: string;
  level: number;
  skillKey: SkillLevelKey;
}[] = [
  { key: "0", label: "Başlangıç", shortLabel: "Baş.", level: 0, skillKey: "beginner" },
  { key: "1", label: "Orta", shortLabel: "Orta", level: 1, skillKey: "intermediate" },
  { key: "2", label: "İleri", shortLabel: "İleri", level: 2, skillKey: "advanced" },
  { key: "3", label: "Uzman", shortLabel: "Uzman", level: 3, skillKey: "expert" },
  { key: "4", label: "Profesyonel", shortLabel: "Pro", level: 4, skillKey: "professional" },
];

/** Katalog büyüdükçe filtrelemeyi kolaylaştıran gruplar (slug bazlı). */
export const ONBOARDING_SPORT_GROUPS: {
  key: string;
  label: string;
  icon: IconName;
  slugs?: readonly string[];
}[] = [
  { key: "all", label: "Tümü", icon: "shapes" },
  {
    key: "team",
    label: "Takım",
    icon: "users",
    slugs: ["futbol", "basketbol", "voleybol"],
  },
  {
    key: "racket",
    label: "Raket",
    icon: "table-tennis-paddle-ball",
    slugs: ["tenis", "masa-tenisi", "badminton"],
  },
  {
    key: "endurance",
    label: "Dayanıklılık",
    icon: "person-running",
    slugs: ["kosu", "bisiklet", "yuzme", "doga-yuruyusu"],
  },
  {
    key: "studio",
    label: "Studio",
    icon: "dumbbell",
    slugs: ["fitness", "pilates", "yoga", "crossfit", "boks"],
  },
];
