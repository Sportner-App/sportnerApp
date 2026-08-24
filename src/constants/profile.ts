import type { ProfileMenuItem, SkillLevelKey } from "@/types/profile";

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    key: "edit",
    label: "Profili Düzenle",
    description: "İsim, bio ve fotoğraf",
    icon: "user-pen",
  },
  {
    key: "sports",
    label: "Sporlarım",
    description: "Seviye ve birincil spor",
    icon: "medal",
  },
  {
    key: "friends",
    label: "Arkadaşlar",
    description: "İstekler ve öneriler",
    icon: "user-group",
  },
  {
    key: "feed",
    label: "Akış",
    description: "Gönderiler ve yorumlar",
    icon: "newspaper",
  },
  {
    key: "badges",
    label: "Rozetler ve görevler",
    description: "Kazandıkların ve ilerleme",
    icon: "trophy",
  },
  {
    key: "albums",
    label: "Albümler",
    description: "Fotoğraf koleksiyonların",
    icon: "images",
  },
  {
    key: "notifications",
    label: "Bildirimler",
    description: "Gelen kutusu",
    icon: "bell",
  },
  {
    key: "notification-settings",
    label: "Bildirim ayarları",
    description: "Hangi uyarıları alacağını seç",
    icon: "sliders",
  },
  {
    key: "privacy",
    label: "Gizlilik",
    description: "Hesap görünürlüğü",
    icon: "shield-halved",
  },
  {
    key: "help",
    label: "Yardım",
    description: "SSS",
    icon: "circle-question",
  },
];

export const PROFILE_COPY = {
  header: "PROFİL",
  sportsTitle: "Sporlarım",
  statsTitle: "İstatistikler",
  menuTitle: "Hesap",
  logout: "Çıkış Yap",
  guestName: "Sporcu",
  emptySports: "Henüz spor eklenmemiş.",
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
