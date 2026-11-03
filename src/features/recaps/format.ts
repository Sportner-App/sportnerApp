import { getCurrentLocale } from "@/i18n";

/** "2026-11" → "Kasım 2026" (uygulama diline göre). */
export function formatRecapMonth(month: string, withYear = true) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(new Date(year, monthIndex - 1, 1));
}

export function formatWeekday(day: number) {
  // 2023-01-01 bir pazar; gün indeksini doğrudan ekliyoruz.
  return new Intl.DateTimeFormat(getCurrentLocale(), { weekday: "long" }).format(
    new Date(2023, 0, 1 + day),
  );
}

/** Takvim ayını ±n kaydırır. */
export function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Geçen ayın özeti ayın bu gününden itibaren "hazır" sayılıyor: backend
 * bildirimi de 3'ünde gidiyor (ay sonu yoklamaları ve semt taçları otursun diye).
 */
export const RECAP_READY_DAY = 3;

/** İstanbul takviminde bugünün ay içindeki günü. */
export function istanbulDayOfMonth() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCDate();
}

/** İstanbul takvimine göre içinde bulunulan ay. */
export function currentIstanbulMonth() {
  const istanbul = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return istanbul.toISOString().slice(0, 7);
}

/** Yıllık özet 15 Aralık'ta açılır ve 31 Ocak'a kadar öne çıkarılır. */
export const YEARLY_REVEAL_DAY = 15;

/**
 * Yıllık özetin öne çıkarıldığı dönemde hangi yılın özeti gösterilir; dönem
 * dışındaysa null. (15 Aralık–31 Aralık: bu yıl, Ocak: geçen yıl.)
 */
export function yearlyRevealYear(): number | null {
  const istanbul = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const month = istanbul.getUTCMonth() + 1;
  if (month === 12 && istanbul.getUTCDate() >= YEARLY_REVEAL_DAY) {
    return istanbul.getUTCFullYear();
  }
  if (month === 1) {
    return istanbul.getUTCFullYear() - 1;
  }
  return null;
}

/** 1–12 → "Kasım" */
export function formatMonthName(month: number) {
  return new Intl.DateTimeFormat(getCurrentLocale(), { month: "long" }).format(
    new Date(2023, month - 1, 1),
  );
}
