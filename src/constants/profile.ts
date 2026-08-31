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

export const PROFILE_MENU_GROUPS: ProfileMenuGroup[] = [
  {
    key: "account",
    title: "Hesap",
    items: [
      { key: "notifications", label: "Bildirimler", icon: "bell" },
      {
        key: "notification-settings",
        label: "Bildirim ayarları",
        icon: "sliders",
      },
      { key: "appearance", label: "Görünüm", icon: "circle-half-stroke" },
      { key: "privacy", label: "Gizlilik", icon: "shield-halved" },
      { key: "feedback", label: "Öneri gönder", icon: "lightbulb" },
      { key: "help", label: "Yardım", icon: "circle-question" },
      {
        key: "app-tour",
        label: "Uygulama turunu yeniden göster",
        icon: "route",
      },
    ],
  },
];

export const PROFILE_COPY = {
  header: "PROFİL",
  sportsTitle: "Sporlar",
  statsTitle: "Özet",
  socialTitle: "Sosyal",
  menuTitle: "Hesap",
  logout: "Çıkış yap",
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

export const SKILL_LEVEL_LABELS: Record<SkillLevelKey, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
  expert: "Uzman",
  professional: "Profesyonel",
};

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
