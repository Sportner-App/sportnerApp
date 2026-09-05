/**
 * Sportner design-system API.
 *
 * Source of truth: `design-tokens.js`.
 * Existing screens keep using NativeWind `brand-*` classes and
 * `@/constants/colors`. New screens should import `appTheme` / helpers here.
 */
import type { TextStyle } from "react-native";

import tokens from "./design-tokens";
import type {
  NativeShadow,
  SportAccentName,
  SportAccentToken,
} from "./design-tokens";

export type {
  DesignTokens,
  NativeShadow,
  SportAccentName,
  SportAccentToken,
  TextStyleToken,
} from "./design-tokens";

/**
 * Katalog slug'ı → aksan tokeni. Hem güncel Türkçe slug'lar hem de seed'deki
 * legacy İngilizce slug'lar eşlenir; katalogdaki 34 branşın tamamı kapsanır.
 */
const SPORT_ACCENT_BY_SLUG: Record<string, SportAccentName> = {
  // Takım sporları
  basketbol: "basketball",
  basketball: "basketball",
  futbol: "football",
  football: "football",
  voleybol: "volleyball",
  volleyball: "volleyball",
  hentbol: "handball",
  "plaj-voleybolu": "beachVolleyball",
  rugby: "rugby",

  // Raket sporları
  tenis: "tennis",
  tennis: "tennis",
  "masa-tenisi": "tableTennis",
  "table-tennis": "tableTennis",
  badminton: "badminton",
  padel: "padel",
  pickleball: "pickleball",
  squash: "squash",

  // Fitness & kondisyon
  fitness: "fitness",
  crossfit: "crossfit",
  pilates: "pilates",
  yoga: "yoga",
  dans: "dance",

  // Dövüş sporları
  boks: "boxing",
  boxing: "boxing",
  kickboks: "kickboxing",
  judo: "judo",
  "jiu-jitsu": "jiuJitsu",
  karate: "karate",

  // Outdoor & dayanıklılık
  kosu: "running",
  running: "running",
  bisiklet: "cycling",
  cycling: "cycling",
  "doga-yuruyusu": "hiking",
  hiking: "hiking",
  tirmanis: "climbing",

  // Su sporları
  yuzme: "swimming",
  swimming: "swimming",
  dalis: "diving",
  yelken: "sailing",

  // Kış sporları
  kayak: "ski",
  snowboard: "snowboard",

  // Hedef sporları
  bowling: "bowling",
  golf: "golf",
  okculuk: "archery",
};

export const palette = tokens.palette;
export const themeColors = tokens.colors;
export const sportAccents = tokens.sports;
export const fonts = tokens.fonts;
export const typography = tokens.typography;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const media = tokens.media;
export const componentTokens = tokens.components;
export const legacyTokens = tokens.legacy;

export const shadows: Record<"sm" | "md" | "lg" | "glow", NativeShadow> = {
  sm: tokens.shadows.sm.native,
  md: tokens.shadows.md.native,
  lg: tokens.shadows.lg.native,
  glow: tokens.shadows.glow.native,
};

export const shadowCss = {
  sm: tokens.shadows.sm.css,
  md: tokens.shadows.md.css,
  lg: tokens.shadows.lg.css,
  glow: tokens.shadows.glow.css,
} as const;

export function sportKeyForSlug(
  slug: string | null | undefined,
): SportAccentName | null {
  if (!slug) {
    return null;
  }

  return SPORT_ACCENT_BY_SLUG[slug.toLowerCase()] ?? null;
}

export function sportAccentToken(
  slug: string | null | undefined,
): SportAccentToken | null {
  const key = sportKeyForSlug(slug);
  return key ? sportAccents[key] : null;
}

export function sportAccentForSlug(
  slug: string | null | undefined,
  fallback: string = themeColors.brand.primary,
): string {
  return sportAccentToken(slug)?.accent ?? fallback;
}

export const typeStyles: Record<keyof typeof typography, TextStyle> = {
  display: typography.display,
  headingLarge: typography.headingLarge,
  headingMedium: typography.headingMedium,
  headingSmall: typography.headingSmall,
  bodyLarge: typography.bodyLarge,
  body: typography.body,
  bodySmall: typography.bodySmall,
  label: typography.label,
  caption: typography.caption,
  overline: typography.overline,
};

export const appTheme = {
  colors: themeColors,
  sports: sportAccents,
  fonts,
  typography,
  typeStyles,
  spacing,
  radius,
  shadows,
  media,
  components: componentTokens,
  legacy: legacyTokens,
} as const;

export type AppTheme = typeof appTheme;
