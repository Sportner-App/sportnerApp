const lime = "#ccff00";

/**
 * Ham renkler. Ekranlar bunları doğrudan değil, aşağıdaki semantik `colors`
 * üzerinden kullanır; açık tema karşılıkları `theme-palettes.ts` içinde.
 */
const palette = {
  lime,
  canvas: "#06111a",
  canvasRaised: "#091722",
  surface: "#0d1b27",
  surfaceRaised: "#152635",
  ink: "#f4f6f2",
  inkMuted: "#a8b2b8",
  inkSoft: "#6f7d86",
  line: "#203443",
  lineStrong: "#345064",
  white: "#ffffff",
  overlay: "rgba(2, 8, 13, 0.58)",
  /** Fotoğraf üstündeki metin için tek, düz karartma. */
  photoScrim: "rgba(6, 17, 26, 0.72)",
  success: "#5eead4",
  warning: "#fda4af",
  destructive: "#ef4444",
};

const colors = {
  brand: {
    primary: palette.lime,
  },
  /** Lime yalnızca ekrandaki tek birincil aksiyonda kullanılır. */
  action: {
    primary: palette.lime,
    onPrimary: palette.canvas,
  },
  background: {
    primary: palette.canvas,
    secondary: palette.canvasRaised,
  },
  surface: {
    primary: palette.surface,
    secondary: palette.surfaceRaised,
  },
  text: {
    primary: palette.ink,
    secondary: palette.inkMuted,
    tertiary: palette.inkSoft,
    inverse: palette.ink,
    /** Text sitting on lime CTAs */
    onPrimary: palette.canvas,
  },
  border: {
    default: palette.line,
    strong: palette.lineStrong,
  },
  overlay: {
    dark: palette.overlay,
    photo: palette.photoScrim,
  },
  success: palette.success,
  warning: palette.warning,
  destructive: palette.destructive,
};

function relativeLuminance(hexColor) {
  const hex = hexColor.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Aksan renginden koyu zemin tonu ve okunabilir metin rengi türetir; böylece
 * her spor için üç değeri elle yazmak gerekmez.
 */
function sportAccent(accent) {
  const hex = accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const darkText = palette.canvas;
  const lightText = "#ffffff";
  const maximumContrastText = "#000000";

  // Kart zeminine (palette.canvas) doğru karıştırılmış koyu ton.
  const mix = (channel, canvas) =>
    Math.round(channel * 0.18 + canvas * 0.82)
      .toString(16)
      .padStart(2, "0");

  const preferredText =
    contrastRatio(accent, darkText) >= contrastRatio(accent, lightText)
      ? darkText
      : lightText;

  return {
    accent,
    soft: `#${mix(r, 6)}${mix(g, 17)}${mix(b, 26)}`,
    onAccent:
      contrastRatio(accent, preferredText) >= 4.5
        ? preferredText
        : maximumContrastText,
  };
}

/**
 * Katalogdaki her spor için canlı bir aksan. Renkler kategori ailelerine göre
 * seçildi; tokensız kalan bir spor gri fallback'e düşüp rozetlerde soluk
 * göründüğü için katalogdaki 34 branşın tamamı burada tanımlı.
 */
const sports = {
  // Takım sporları
  basketball: {
    accent: "#ff6b1a",
    soft: "#3a2016",
    onAccent: palette.canvas,
  },
  football: {
    // Açık sarı-yeşil zemin: beyaz yazı okunmuyordu, koyu metin kullanılıyor.
    accent: "#9ed900",
    soft: "#253414",
    onAccent: palette.canvas,
  },
  volleyball: {
    accent: "#9a72ff",
    soft: "#2c2148",
    onAccent: palette.canvas,
  },
  handball: sportAccent("#14b8a6"),
  beachVolleyball: sportAccent("#fbbf24"),
  rugby: sportAccent("#dc2626"),

  // Raket sporları
  tennis: {
    accent: "#d7ef32",
    soft: "#303817",
    onAccent: palette.canvas,
  },
  tableTennis: sportAccent("#22d3ee"),
  badminton: sportAccent("#f472b6"),
  padel: sportAccent("#6366f1"),
  pickleball: sportAccent("#d946ef"),
  squash: sportAccent("#0ea5e9"),

  // Fitness & kondisyon
  fitness: sportAccent("#a855f7"),
  crossfit: sportAccent("#f43f5e"),
  pilates: sportAccent("#fb923c"),
  yoga: sportAccent("#34d399"),
  dance: sportAccent("#e879f9"),

  // Dövüş sporları
  boxing: sportAccent("#ef4444"),
  kickboxing: sportAccent("#f97316"),
  judo: sportAccent("#3b82f6"),
  jiuJitsu: sportAccent("#8b5cf6"),
  karate: sportAccent("#eab308"),

  // Outdoor & dayanıklılık
  running: {
    accent: "#42a5ff",
    soft: "#142d45",
    onAccent: palette.canvas,
  },
  cycling: sportAccent("#22c55e"),
  hiking: sportAccent("#84cc16"),
  climbing: sportAccent("#d97706"),

  // Su sporları
  swimming: sportAccent("#06b6d4"),
  diving: sportAccent("#0284c7"),
  sailing: sportAccent("#38bdf8"),
  rowing: sportAccent("#1d4ed8"),

  // Kış sporları
  ski: sportAccent("#60a5fa"),
  snowboard: sportAccent("#a78bfa"),

  // Hedef sporları
  bowling: sportAccent("#be123c"),
  golf: sportAccent("#16a34a"),
  archery: sportAccent("#ca8a04"),
};

const fonts = {
  display: "Anybody_700Bold",
  displaySemiBold: "Anybody_600SemiBold",
  body: "HankenGrotesk_500Medium",
  bodyBold: "HankenGrotesk_700Bold",
};

/** Semantic type styles — existing font families, new hierarchy. */
const typography = {
  display: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.7,
  },
  headingLarge: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  headingMedium: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headingSmall: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

const radius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  pill: 9999,
};

const shadows = {
  sm: {
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.24,
      shadowRadius: 6,
      elevation: 2,
    },
    css: "0 2px 10px rgba(0, 0, 0, 0.24)",
  },
  md: {
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.32,
      shadowRadius: 16,
      elevation: 5,
    },
    css: "0 8px 24px rgba(0, 0, 0, 0.32)",
  },
  lg: {
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 28,
      elevation: 8,
    },
    css: "0 16px 42px rgba(0, 0, 0, 0.4)",
  },
};

const media = {
  cardRadius: radius.large,
  overlayColor: palette.photoScrim,
};

const designTokens = {
  palette,
  colors,
  sports,
  fonts,
  typography,
  spacing,
  radius,
  shadows,
  media,
};

module.exports = designTokens;
module.exports.default = designTokens;
