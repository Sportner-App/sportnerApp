import { BIRTH_DATE_MAX_AGE, BIRTH_DATE_MIN_AGE } from "@/constants/validation";

/**
 * Doğum tarihi formlarda `GG.AA.YYYY` olarak girilir, API'ye `YYYY-AA-GG`
 * olarak gider.
 */

/** Yazılan rakamları `GG.AA.YYYY` maskesine sokar. */
export function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** `GG.AA.YYYY` → Date; takvimde olmayan tarihler (31.02) için null. */
export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export function isAllowedBirthDate(date: Date) {
  const today = new Date();
  const youngest = new Date(
    today.getFullYear() - BIRTH_DATE_MIN_AGE,
    today.getMonth(),
    today.getDate(),
  );
  const oldest = new Date(
    today.getFullYear() - BIRTH_DATE_MAX_AGE,
    today.getMonth(),
    today.getDate(),
  );
  return date >= oldest && date <= youngest;
}

/** `GG.AA.YYYY` → `YYYY-AA-GG`. Girdinin önceden doğrulanmış olduğunu varsayar. */
export function toApiBirthDate(value: string) {
  const [day, month, year] = value.trim().split(".");
  return `${year}-${month}-${day}`;
}

/** Geçerli ve izin verilen yaş aralığındaysa API biçimi, değilse null. */
export function toValidApiBirthDate(value: string) {
  const date = parseBirthDate(value);
  return date && isAllowedBirthDate(date) ? toApiBirthDate(value) : null;
}

/** API'den gelen `YYYY-AA-GG…` → `GG.AA.YYYY`. */
export function fromApiBirthDate(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : "";
}
