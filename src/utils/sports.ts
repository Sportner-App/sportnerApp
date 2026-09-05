import type { Sport } from "@/types/sports";

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
      label: sport.categoryName ?? "Diğer",
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
