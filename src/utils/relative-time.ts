import i18n, { getCurrentLocale } from "@/i18n";

type ElapsedParts = { minutes: number; hours: number; days: number };

function elapsedSince(timestamp: number): ElapsedParts {
  const minutes = Math.max(Math.floor((Date.now() - timestamp) / 60_000), 0);
  const hours = Math.floor(minutes / 60);
  return { minutes, hours, days: Math.floor(hours / 24) };
}

/** "şimdi / N dk / N sa" — bir günden eskiyse null. */
function formatWithinDay({ minutes, hours }: ElapsedParts): string | null {
  if (minutes < 1) {
    return i18n.t("social:relativeTime.now");
  }
  if (minutes < 60) {
    return i18n.t("social:relativeTime.minutes", { count: minutes });
  }
  if (hours < 24) {
    return i18n.t("social:relativeTime.hours", { count: hours });
  }
  return null;
}

export function formatRelativeTime(iso: string): string {
  const elapsed = elapsedSince(new Date(iso).getTime());
  const withinDay = formatWithinDay(elapsed);
  if (withinDay) {
    return withinDay;
  }

  if (elapsed.days < 7) {
    return i18n.t("social:relativeTime.days", { count: elapsed.days });
  }

  return new Date(iso).toLocaleDateString(getCurrentLocale());
}

/** Instagram benzeri, tam tarihe dönmeden her zaman kısa kalan zaman etiketi. */
export function formatCompactRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const elapsed = elapsedSince(timestamp);
  const withinDay = formatWithinDay(elapsed);
  if (withinDay) {
    return withinDay;
  }

  const { days } = elapsed;
  if (days < 7) {
    return i18n.t("social:relativeTime.daysShort", { count: days });
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return i18n.t("social:relativeTime.weeks", { count: weeks });
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return i18n.t("social:relativeTime.months", { count: months });
  }

  return i18n.t("social:relativeTime.years", {
    count: Math.floor(days / 365),
  });
}
