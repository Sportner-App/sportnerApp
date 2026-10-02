import i18n, { getCurrentLocale } from "@/i18n";
import { calendarDaysFromToday, formatClockTime } from "@/utils/date-format";

/**
 * Rozet metninden bağımsız aciliyet kontrolü — `relativeEventBadge`'in
 * dönüş metni dile göre değiştiği için ("BUGÜN" vs "TODAY") rozet rengi gibi
 * davranışsal kararlar bu metne değil doğrudan tarihe bakmalı.
 */
export function isEventToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return calendarDaysFromToday(date) === 0;
}

/** BUGÜN / YARIN / N GÜN SONRA — uzak tarihlerde null. */
export function relativeEventBadge(isoDate: string): string | null {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayDiff = calendarDaysFromToday(date);

  if (dayDiff === 0) {
    return i18n.t("events:badge.today");
  }

  if (dayDiff === 1) {
    return i18n.t("events:badge.tomorrow");
  }

  if (dayDiff >= 2 && dayDiff <= 6) {
    return i18n.t("events:badge.inDays", { count: dayDiff });
  }

  return null;
}

export function formatEventDateLabel(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const time = formatClockTime(isoDate);

  const dayDiff = calendarDaysFromToday(date);

  if (dayDiff === 0) {
    return `${i18n.t("events:dateLabel.today")} · ${time}`;
  }

  if (dayDiff === 1) {
    return `${i18n.t("events:dateLabel.tomorrow")} · ${time}`;
  }

  if (dayDiff > 1 && dayDiff < 7) {
    const weekdaysShort = i18n.t("events:weekdaysShort", {
      returnObjects: true,
    }) as string[];
    return `${weekdaysShort[date.getDay()]} · ${time}`;
  }

  const dayMonth = date.toLocaleDateString(getCurrentLocale(), {
    day: "numeric",
    month: "short",
  });

  return `${dayMonth} · ${time}`;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) {
    return i18n.t("events:duration.minutes", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return i18n.t("events:duration.hours", { count: hours });
  }

  return i18n.t("events:duration.hoursAndMinutes", { hours, minutes: rest });
}

/** Etkinlik listesinde/haritasında adres yokken gösterilen yer tutucu. */
export function noLocationLabel(): string {
  return i18n.t("events:fallback.noLocation");
}

/** Açıklama girilmemişken gösterilen yer tutucu metin. */
export function noDescriptionLabel(): string {
  return i18n.t("events:fallback.noDescription");
}

export function parseFeeAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function formatTryAmount(amount: number): string {
  return `${new Intl.NumberFormat(getCurrentLocale(), {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)} ₺`;
}

export function formatEventFee(
  isPaid: boolean,
  feeAmount: number | null | undefined,
): string {
  if (!isPaid || feeAmount == null) {
    return i18n.t("events:fee.free");
  }

  return formatTryAmount(feeAmount);
}

export function eventStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return i18n.t("events:status.draft");
    case 1:
      return i18n.t("events:status.published");
    case 2:
      return i18n.t("events:status.full");
    case 3:
      return i18n.t("events:status.completed");
    case 4:
      return i18n.t("events:status.cancelled");
    default:
      return i18n.t("events:fallback.event");
  }
}

export function participantStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return i18n.t("events:participantStatus.pending");
    case 1:
      return i18n.t("events:participantStatus.approved");
    case 2:
      return i18n.t("events:participantStatus.rejected");
    case 3:
      return i18n.t("events:participantStatus.left");
    case 4:
      return i18n.t("events:participantStatus.attended");
    case 5:
      return i18n.t("events:participantStatus.noShow");
    case 6:
      return i18n.t("events:participantStatus.invited");
    default:
      return "";
  }
}
