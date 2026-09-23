import { useTranslation } from "react-i18next";

import type { ActivityTab } from "@/hooks/use-activity";

export function useActivityCopy(counts: Record<ActivityTab, number>) {
  const { t } = useTranslation("activity");

  const tabs: { key: ActivityTab; label: string; badge: number }[] = [
    { key: "upcoming", label: t("tabs.upcoming"), badge: counts.upcoming },
    { key: "pending", label: t("tabs.pending"), badge: counts.pending },
    { key: "past", label: t("tabs.past"), badge: counts.past },
    {
      key: "organized",
      label: t("tabs.organized"),
      badge: counts.organized,
    },
  ];

  const emptyCopy: Record<
    ActivityTab,
    { message: string; action: string; href: "/events/create" | "/(tabs)" }
  > = {
    upcoming: {
      message: t("empty.upcoming.message"),
      action: t("empty.upcoming.action"),
      href: "/(tabs)",
    },
    pending: {
      message: t("empty.pending.message"),
      action: t("empty.pending.action"),
      href: "/(tabs)",
    },
    past: {
      message: t("empty.past.message"),
      action: t("empty.past.action"),
      href: "/(tabs)",
    },
    organized: {
      message: t("empty.organized.message"),
      action: t("empty.organized.action"),
      href: "/events/create",
    },
  };

  return {
    title: t("title"),
    subtitle: t("subtitle"),
    loading: t("loading"),
    loadingMore: t("loadingMore"),
    eventCount: (count: number) => t("eventCount", { count }),
    tabs,
    emptyCopy,
  };
}
