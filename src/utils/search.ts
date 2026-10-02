import { getCurrentLocale } from "@/i18n";

/** İstemci tarafı filtreleme için arama metnini dile duyarlı küçük harfe çevirir. */
export function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase(getCurrentLocale());
}

/** Boş sorgu her şeyle eşleşir; aksi halde alanlardan biri sorguyu içermeli. */
export function matchesSearch(
  query: string,
  fields: (string | null | undefined)[],
): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return fields.some(
    (field) => field && normalizeSearch(field).includes(needle),
  );
}
