import i18n from "@/i18n";
import { getCurrentLocale } from "@/i18n";

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(Math.floor(diff / 60_000), 0);

  if (minutes < 1) {
    return i18n.t("social:relativeTime.now");
  }
  if (minutes < 60) {
    return i18n.t("social:relativeTime.minutes", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return i18n.t("social:relativeTime.hours", { count: hours });
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return i18n.t("social:relativeTime.days", { count: days });
  }

  return new Date(iso).toLocaleDateString(getCurrentLocale());
}
