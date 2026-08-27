const lime = "#ccff00";

const palette = {
  lime,

  cream: "#06111a",
  creamMuted: "#091722",
  white: "#ffffff",
  parchment: "#0d1b27",
  mist: "#152635",
  oliveDeep: "#06111a",
  olive: "#0a1822",
  oliveSoft: "#102431",
  charcoal: "#1c1917",
  charcoalRaised: "#2a2622",
  ink: "#f4f6f2",
  inkMuted: "#a8b2b8",
  inkSoft: "#6f7d86",
  inkInverse: "#f4f6f2",
  line: "#203443",
  lineStrong: "#345064",
  overlay: "rgba(2, 8, 13, 0.58)",

  success: "#5eead4",
  warning: "#fda4af",

  destructive: "#ef4444",
  navy: "#06111a",
  navyMuted: "#1e293b",
  navySurface: "#152238",
  navyRaised: "#1e2d46",
  navyHighlight: "#243652",
  navyCanvas: "#111827",
  navySearch: "#1c2c44",
  slate50: "#f8fafc",
  slate950: "#020617",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slateTab: "#aeb9cf",
  metric: "#d8dcb8",
  limeBorder: "rgba(204,255,0,0.18)",
  limeBorderStrong: "rgba(204,255,0,0.42)",
};

const colors = {
  brand: {
    primary: palette.lime,
  },
  background: {
    primary: palette.cream,
    secondary: palette.creamMuted,
    oliveTop: palette.oliveDeep,
    oliveMiddle: palette.olive,
    oliveBottom: palette.oliveSoft,
  },
  surface: {
    primary: palette.parchment,
    secondary: palette.mist,
    dark: palette.charcoal,
  },
  text: {
    primary: palette.ink,
    secondary: palette.inkMuted,
    tertiary: palette.inkSoft,
    inverse: palette.inkInverse,
    /** Text sitting on lime CTAs */
    onPrimary: palette.cream,
  },
  border: {
    default: palette.line,
    strong: palette.lineStrong,
  },
  overlay: {
    dark: palette.overlay,
  },
  success: palette.success,
  warning: palette.warning,
  destructive: palette.destructive,
};

const sports = {
  basketball: {
    accent: "#ff6b1a",
    soft: "#3a2016",
    onAccent: "#ffffff",
  },
  football: {
    accent: "#9ed900",
    soft: "#253414",
    onAccent: "#ffffff",
  },
  running: {
    accent: "#42a5ff",
    soft: "#142d45",
    onAccent: "#ffffff",
  },
  volleyball: {
    accent: "#9a72ff",
    soft: "#2c2148",
    onAccent: "#ffffff",
  },
  tennis: {
    accent: "#d7ef32",
    soft: "#303817",
    onAccent: "#06111a",
  },
};

const fonts = {
  display: "Anybody_700Bold",
  displaySemiBold: "Anybody_600SemiBold",
  body: "HankenGrotesk_500Medium",
  bodyBold: "HankenGrotesk_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
};

/** Semantic type styles — existing font families, new hierarchy. */
const typography = {
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  headingLarge: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headingMedium: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
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
    fontSize: 16,
    lineHeight: 24,
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
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase",
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
  glow: {
    native: {
      shadowColor: lime,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
    css: "0 4px 14px rgba(204, 255, 0, 0.22)",
  },
};

const media = {
  cardRadius: radius.xl,
  heroRadius: 32,
  overlayOpacity: 0.45,
  overlayColor: palette.overlay,
};

const components = {
  button: {
    primary: {
      background: colors.brand.primary,
      foreground: colors.text.onPrimary,
      border: "transparent",
    },
    secondary: {
      background: colors.surface.primary,
      foreground: colors.text.primary,
      border: colors.border.default,
    },
    ghost: {
      background: "transparent",
      foreground: colors.text.secondary,
      border: "transparent",
    },
    destructive: {
      background: colors.destructive,
      foreground: palette.white,
      border: "transparent",
    },
  },
  card: {
    default: {
      background: colors.surface.primary,
      border: colors.border.default,
      radius: radius.large,
    },
    elevated: {
      background: colors.surface.primary,
      border: "transparent",
      radius: radius.large,
      shadow: "md",
    },
    dark: {
      background: colors.surface.dark,
      foreground: colors.text.inverse,
      border: "transparent",
      radius: radius.large,
    },
    media: {
      background: colors.surface.dark,
      radius: media.cardRadius,
      overlayOpacity: media.overlayOpacity,
    },
  },
  chip: {
    default: {
      background: colors.surface.secondary,
      foreground: colors.text.secondary,
      border: colors.border.default,
      radius: radius.pill,
    },
    selected: {
      background: colors.brand.primary,
      foreground: colors.text.onPrimary,
      border: colors.brand.primary,
      radius: radius.pill,
    },
    sport: {
      radius: radius.pill,
    },
  },
  badge: {
    sport: {
      radius: radius.pill,
    },
    status: {
      radius: radius.small,
      success: colors.success,
      warning: colors.warning,
      destructive: colors.destructive,
    },
  },
};

/**
 * Exact shape of the current `colorPalette` export.
 * Do not rename keys — Input and other components depend on them.
 */
const legacyPalette = {
  primary: palette.lime,
  secondary: palette.navy,
  tertiary: palette.navyMuted,
  neutral: palette.slate500,
  white: palette.slate50,
  black: palette.slate950,
  success: palette.success,
  warning: palette.warning,
};

/** Current light + dark schemes are identical navy UI (legacy). */
const legacyScheme = {
  text: legacyPalette.white,
  textMuted: palette.slate300,
  textSoft: palette.slate400,
  background: legacyPalette.secondary,
  backgroundCanvas: palette.navyCanvas,
  surface: palette.navySurface,
  surfaceRaised: palette.navyRaised,
  surfaceMuted: legacyPalette.tertiary,
  border: palette.limeBorder,
  borderStrong: palette.limeBorderStrong,
  tint: legacyPalette.primary,
  tabIconDefault: palette.slateTab,
  tabIconSelected: legacyPalette.primary,
  cardAccent: legacyPalette.primary,
  cardHighlight: palette.navyHighlight,
  metric: palette.metric,
  searchBackground: palette.navySearch,
  destructive: legacyPalette.warning,
};

const legacy = {
  palette: legacyPalette,
  scheme: legacyScheme,
  navy: palette.navy,
  navyMuted: palette.navyMuted,
  navySurface: palette.navySurface,
  navyRaised: palette.navyRaised,
  navyHighlight: palette.navyHighlight,
  navyCanvas: palette.navyCanvas,
  navySearch: palette.navySearch,
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
  components,
  legacy,
};

module.exports = designTokens;
module.exports.default = designTokens;
