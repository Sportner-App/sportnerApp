import { useTranslation } from "react-i18next";

import type {
  ProfileMenuGroup,
  ProfileMenuItem,
  SkillLevelKey,
} from "@/types/profile";
import { FEATURE_FLAGS } from "./feature-flags";

const PROFILE_SOCIAL_ACTION_ITEMS: ProfileMenuItem[] = [
  { key: "friends", label: "Arkadaşlar", icon: "user-group" },
  { key: "feed", label: "Akış", icon: "newspaper" },
  { key: "badges", label: "Rozetler", icon: "trophy" },
  { key: "albums", label: "Albümler", icon: "images" },
];

export const PROFILE_SOCIAL_ACTIONS = PROFILE_SOCIAL_ACTION_ITEMS.filter(
  (item) => item.key !== "albums" || FEATURE_FLAGS.albums,
);

/**
 * Profil menüsü — dil değiştiğinde etiketler yeniden çözülsün diye hook.
 * Menünün yönlendirdiği ekranların çoğu henüz kendi başına çevrilmedi;
 * bu yalnızca menü satırlarını kapsıyor.
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

export const PROFILE_COPY = {
  header: "PROFİL",
  sportsTitle: "Sporlar",
  organizationsTitle: "Organizasyonlar",
  emptyOrganizations: "Henüz organizasyonun yok. Dokunarak ekle veya katıl.",
  statsTitle: "Özet",
  socialTitle: "Sosyal",
  menuTitle: "Hesap",
  edit: "Profili düzenle",
  guestName: "Sporcu",
  emptySports: "Henüz spor eklemedin. Dokunarak ekle.",
  emptySportsPublic: "Henüz spor eklenmemiş.",
  reviewsTitle: "Değerlendirmeler",
  emptyReviews:
    "Henüz değerlendirme yok. Etkinlik sonrası gelen yorumlar burada görünür.",
  notFound: "Profil bulunamadı. Kayıt sırasında profil oluşmamış olabilir.",
} as const;

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
