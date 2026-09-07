import { useTranslation } from "react-i18next";

import type {
  ProfileMenuGroup,
  ProfileMenuItem,
  SkillLevelKey,
} from "@/types/profile";
import type { SegmentedTabOption } from "@/types/components";
import type { ProfileStatistics } from "@/types/profile";
import { FEATURE_FLAGS } from "./feature-flags";

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
    { key: "friends" as const, label: t("about.friends"), icon: "user-group" as const },
    { key: "badges" as const, label: t("about.badges"), icon: "trophy" as const },
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

export function useProfileSocialActions(): ProfileMenuItem[] {
  const { t } = useTranslation("profile");

  const items: ProfileMenuItem[] = [
    { key: "friends", label: t("about.friends"), icon: "user-group" },
    { key: "feed", label: t("social.feed"), icon: "newspaper" },
    { key: "badges", label: t("about.badges"), icon: "trophy" },
    { key: "albums", label: t("social.albums"), icon: "images" },
  ];

  return items.filter(
    (item) => item.key !== "albums" || FEATURE_FLAGS.albums,
  );
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
        {
          key: "notification-settings",
          label: t("menu.notificationSettings"),
          icon: "sliders",
        },
        {
          key: "appearance",
          label: t("menu.appearance"),
          icon: "circle-half-stroke",
        },
        { key: "language", label: t("menu.language"), icon: "globe" },
        { key: "privacy", label: t("menu.privacy"), icon: "shield-halved" },
        { key: "feedback", label: t("menu.feedback"), icon: "lightbulb" },
        { key: "help", label: t("menu.help"), icon: "circle-question" },
        {
          key: "app-tour",
          label: t("menu.appTour"),
          icon: "route",
        },
      ],
    },
  ];
}

const SKILL_BY_CODE: Record<number, SkillLevelKey> = {
  0: "beginner",
  1: "intermediate",
  2: "advanced",
  3: "expert",
  4: "professional",
};

export function skillKeyFromCode(code: number): SkillLevelKey {
  return SKILL_BY_CODE[code] ?? "beginner";
}

/** Seviye etiketleri — dil değiştiğinde yeniden çözülsün diye hook. */
export function useSkillLevelLabels(): Record<SkillLevelKey, string> {
  const { t } = useTranslation("skills");

  return {
    beginner: t("beginner"),
    intermediate: t("intermediate"),
    advanced: t("advanced"),
    expert: t("expert"),
    professional: t("professional"),
  };
}

export const SKILL_LEVEL_STYLES: Record<
  SkillLevelKey,
  { container: string; text: string }
> = {
  beginner: {
    container: "border-teal-300/30 bg-teal-400/10",
    text: "text-teal-300",
  },
  intermediate: {
    container: "border-amber-300/30 bg-amber-400/10",
    text: "text-amber-300",
  },
  advanced: {
    container: "border-rose-300/30 bg-rose-400/10",
    text: "text-rose-300",
  },
  expert: {
    container: "border-violet-300/30 bg-violet-400/10",
    text: "text-violet-300",
  },
  professional: {
    container: "border-brand-primary/40 bg-brand-primary/15",
    text: "text-brand-primary",
  },
};
