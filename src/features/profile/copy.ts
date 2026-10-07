import { useTranslation } from "react-i18next";

import type { ProfileMenuGroup } from "@/features/profile/types";
import type { SegmentedTabOption } from "@/types/components";
import type { ProfileStatistics } from "@/features/profile/types";
import { FEATURE_FLAGS } from "@/constants/feature-flags";

type ProfileTab = "activity" | "reviews" | "settings";

/**
 * Profil ekranı paylaşılan kopya metinleri — modül düzeyinde sabit yerine hook:
 * dil değiştiğinde `t()` yeniden değerlendirilsin diye render sırasında
 * çağrılmalı.
 */
export function useProfileCopy() {
  const { t } = useTranslation("profile");

  return {
    sportsTitle: t("sportsTitle"),
    organizationsTitle: t("organizationsTitle"),
    emptyOrganizations: t("emptyOrganizations"),
    emptySports: t("emptySports"),
    emptySportsPublic: t("emptySportsPublic"),
    reviewsTitle: t("reviewsTitle"),
    emptyReviews: t("emptyReviews"),
    notFound: t("notFound"),
  } as const;
}

export function useProfileTabs(): SegmentedTabOption<ProfileTab>[] {
  const { t } = useTranslation("profile");

  return [
    { key: "activity", label: t("tabs.activity") },
    { key: "reviews", label: t("tabs.reviews") },
    { key: "settings", label: t("tabs.settings") },
  ];
}

export function useProfileQuickActions() {
  const { t } = useTranslation("profile");

  return [
    {
      key: "friends" as const,
      label: t("about.friends"),
      icon: "user-group" as const,
    },
    {
      key: "badges" as const,
      label: t("about.badges"),
      icon: "trophy" as const,
    },
  ];
}

export function useStatItems(): {
  key: string;
  label: string;
  field: keyof ProfileStatistics;
}[] {
  const { t } = useTranslation("profile");

  return [
    { key: "joined", label: t("stats.joined"), field: "eventsJoined" },
    { key: "organized", label: t("stats.organized"), field: "eventsOrganized" },
    { key: "completed", label: t("stats.completed"), field: "eventsCompleted" },
    { key: "friends", label: t("stats.friends"), field: "friendsCount" },
  ];
}

/**
 * Profil menüsü — dil değiştiğinde etiketler yeniden çözülsün diye hook.
 */
export function useProfileMenuGroups(): ProfileMenuGroup[] {
  const { t } = useTranslation("settings");

  return [
    {
      key: "account",
      title: t("menu.settingsGroupTitle"),
      items: [
        { key: "edit", label: t("menu.editProfile"), icon: "user-pen" },
        { key: "notifications", label: t("menu.notifications"), icon: "bell" },
        // Light/dark toggle is temporarily disabled; app stays on dark.
        // {
        //   key: "appearance",
        //   label: t("appearance.dark"),
        //   icon: "moon",
        // },
        { key: "language", label: t("language.tr"), icon: "globe" },
        { key: "privacy", label: t("menu.privacy"), icon: "user-gear" },
        { key: "feedback", label: t("menu.feedback"), icon: "lightbulb" },
        { key: "help", label: t("menu.help"), icon: "circle-question" },
        {
          key: "app-tour",
          label: t("menu.appTour"),
          icon: "route",
        },
        {
          key: "logout",
          label: t("logout"),
          icon: "right-from-bracket",
          danger: true,
        },
      ],
    },
  ];
}
