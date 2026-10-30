import i18n from "@/i18n";
import type { IconName } from "@/types/components";
import type { Sport } from "@/features/sports/types";

export type SportGroup = {
  key: string;
  label: string;
  sports: Sport[];
};

const UNCATEGORIZED_KEY = "uncategorized";

/**
 * Sporları katalog kategorisine göre gruplar. Grupların sırası sporların
 * `displayOrder` sırasını izler; kategorisi olmayanlar en sona düşer.
 */
export function groupSportsByCategory(sports: Sport[]): SportGroup[] {
  const groups = new Map<string, SportGroup>();

  for (const sport of sports) {
    const key = sport.categoryId ?? UNCATEGORIZED_KEY;
    const existing = groups.get(key);

    if (existing) {
      existing.sports.push(sport);
      continue;
    }

    groups.set(key, {
      key,
      label: sport.categoryName ?? i18n.t("common:other"),
      sports: [sport],
    });
  }

  return [...groups.values()].sort((a, b) => {
    if (a.key === b.key) return 0;
    if (a.key === UNCATEGORIZED_KEY) return 1;
    if (b.key === UNCATEGORIZED_KEY) return -1;
    return 0;
  });
}

/**
 * Katalogdaki her spor burada olmalı; olmayan "shapes" yedek ikonuna düşer.
 * FontAwesome 6 ücretsiz sette raket ikonu yok: tenis, padel, pickleball ve
 * squash için en yakın ikonlar kullanılıyor.
 */
const SPORT_ICON_BY_SLUG: Record<string, IconName> = {
  futbol: "futbol",
  football: "futbol",
  basketbol: "basketball",
  basketball: "basketball",
  voleybol: "volleyball",
  volleyball: "volleyball",
  tenis: "baseball",
  tennis: "baseball",
  "masa-tenisi": "table-tennis-paddle-ball",
  kosu: "person-running",
  running: "person-running",
  bisiklet: "bicycle",
  cycling: "bicycle",
  yuzme: "person-swimming",
  swimming: "person-swimming",
  fitness: "dumbbell",
  "doga-yuruyusu": "person-hiking",
  hiking: "person-hiking",
  boks: "hand-fist",
  boxing: "hand-fist",
  pilates: "child-reaching",
  yoga: "spa",
  crossfit: "weight-hanging",
  badminton: "feather",
  padel: "table-tennis-paddle-ball",
  pickleball: "table-tennis-paddle-ball",
  squash: "circle",
  hentbol: "hand",
  "plaj-voleybolu": "umbrella-beach",
  kickboks: "hand-back-fist",
  judo: "person-falling",
  "jiu-jitsu": "people-arrows",
  karate: "user-ninja",
  tirmanis: "mountain",
  kayak: "person-skiing",
  snowboard: "person-snowboarding",
  bowling: "bowling-ball",
  dans: "music",
  golf: "golf-ball-tee",
  okculuk: "bullseye",
  dalis: "fish",
  yelken: "sailboat",
  rugby: "football",
  kurek: "water",
  diger: "shapes",
};

export function sportIconForSlug(slug: string): IconName {
  return SPORT_ICON_BY_SLUG[slug.toLowerCase()] ?? "shapes";
}
