import { getCurrentLocale } from "@/i18n";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Bugünden hedef güne takvim günü farkı (dün = -1, bugün = 0, yarın = 1). */
export function calendarDaysFromToday(date: Date): number {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY_MS,
  );
}

/** Dile göre saat:dakika; geçersiz tarihte boş metin. */
export function formatClockTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(getCurrentLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}
