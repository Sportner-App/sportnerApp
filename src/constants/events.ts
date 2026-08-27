import type { SportCategory } from "@/types/sports";

/** Home filter chips — slug'lar backend seed ile uyumlu */
export const SPORT_FILTERS: SportCategory[] = [
  { key: "all", label: "Tümü", icon: "shapes" },
  { key: "futbol", label: "Futbol", icon: "futbol" },
  { key: "basketbol", label: "Basketbol", icon: "basketball" },
  { key: "voleybol", label: "Voleybol", icon: "volleyball" },
  { key: "tenis", label: "Tenis", icon: "table-tennis-paddle-ball" },
  { key: "kosu", label: "Koşu", icon: "person-running" },
];

/** Fallback create options (API sporları yüklenene kadar) */
export const CREATE_SPORT_OPTIONS: SportCategory[] = SPORT_FILTERS.filter(
  (sport) => sport.key !== "all",
);

export const CREATE_EVENT_STEPS = {
  1: {
    title: "Etkinliğini oluştur",
    subtitle: "Sporunu seç ve etkinliğini anlat.",
  },
  2: {
    title: "Planını yap",
    subtitle: "Nerede, ne zaman ve ne kadar süreceğini belirle.",
  },
  3: {
    title: "Takımını kur",
    subtitle: "Kaç kişinin katılabileceğini belirle.",
  },
  4: {
    title: "Yanına kim geliyor?",
    subtitle: "Misafir veya arkadaş ekleyebilirsin. Bu adımı atlayabilirsin.",
  },
} as const;

export const CREATE_EVENT_COPY = {
  header: "YENİ ETKİNLİK",
  title: CREATE_EVENT_STEPS[1].title,
  subtitle: CREATE_EVENT_STEPS[1].subtitle,
  submit: "Etkinliği Yayınla",
  publishing: "Yayınlanıyor...",
  continue: "Devam Et",
  back: "Geri",
} as const;

export const DEFAULT_EVENT_DURATION_MINUTES = 90;

/** Backend: DurationMinutes > 0 */
export const DURATION_OPTIONS: {
  key: string;
  label: string;
  minutes: number;
}[] = [
  { key: "30", label: "30 dakika", minutes: 30 },
  { key: "45", label: "45 dakika", minutes: 45 },
  { key: "60", label: "1 saat", minutes: 60 },
  { key: "90", label: "1.5 saat", minutes: 90 },
  { key: "120", label: "2 saat", minutes: 120 },
  { key: "180", label: "3 saat", minutes: 180 },
];

export const CREATE_EVENT_LIMITS = {
  titleMax: 150,
  maxParticipantsMin: 2,
  maxParticipantsMax: 1000,
} as const;

export const DEFAULT_EVENT_LOCATION = {
  latitude: 40.9909,
  longitude: 29.0289,
} as const;
