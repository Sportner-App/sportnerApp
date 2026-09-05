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
    subtitle:
      "Fotoğraf, tanıtım videosu, şehir ve bio opsiyonel; sonra da ekleyebilirsin.",
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
