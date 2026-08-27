export type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: "uppercase" | "none";
};

export type NativeShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type ShadowToken = {
  native: NativeShadow;
  css: string;
};

export type SportAccentToken = {
  accent: string;
  soft: string;
  onAccent: string;
};

export type SportAccentName =
  "basketball" | "football" | "running" | "volleyball" | "tennis";

export type LegacyScheme = {
  text: string;
  textMuted: string;
  textSoft: string;
  background: string;
  backgroundCanvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  cardAccent: string;
  cardHighlight: string;
  metric: string;
  searchBackground: string;
  destructive: string;
};

export type DesignTokens = {
  palette: {
    lime: string;
    cream: string;
    creamMuted: string;
    white: string;
    parchment: string;
    mist: string;
    oliveDeep: string;
    olive: string;
    oliveSoft: string;
    charcoal: string;
    charcoalRaised: string;
    ink: string;
    inkMuted: string;
    inkSoft: string;
    inkInverse: string;
    line: string;
    lineStrong: string;
    overlay: string;
    success: string;
    warning: string;
    destructive: string;
    navy: string;
    navyMuted: string;
    navySurface: string;
    navyRaised: string;
    navyHighlight: string;
    navyCanvas: string;
    navySearch: string;
    slate50: string;
    slate950: string;
    slate300: string;
    slate400: string;
    slate500: string;
    slateTab: string;
    metric: string;
    limeBorder: string;
    limeBorderStrong: string;
  };
  colors: {
    brand: { primary: string };
    background: {
      primary: string;
      secondary: string;
      oliveTop: string;
      oliveMiddle: string;
      oliveBottom: string;
    };
    surface: { primary: string; secondary: string; dark: string };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      onPrimary: string;
    };
    border: { default: string; strong: string };
    overlay: { dark: string };
    success: string;
    warning: string;
    destructive: string;
  };
  sports: Record<SportAccentName, SportAccentToken>;
  fonts: {
    display: string;
    displaySemiBold: string;
    body: string;
    bodyBold: string;
    mono: string;
    monoBold: string;
  };
  typography: {
    display: TextStyleToken;
    headingLarge: TextStyleToken;
    headingMedium: TextStyleToken;
    headingSmall: TextStyleToken;
    bodyLarge: TextStyleToken;
    body: TextStyleToken;
    bodySmall: TextStyleToken;
    label: TextStyleToken;
    caption: TextStyleToken;
    overline: TextStyleToken;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
  };
  radius: {
    small: number;
    medium: number;
    large: number;
    xl: number;
    pill: number;
  };
  shadows: {
    sm: ShadowToken;
    md: ShadowToken;
    lg: ShadowToken;
    glow: ShadowToken;
  };
  media: {
    cardRadius: number;
    heroRadius: number;
    overlayOpacity: number;
    overlayColor: string;
  };
  components: {
    button: {
      primary: { background: string; foreground: string; border: string };
      secondary: { background: string; foreground: string; border: string };
      ghost: { background: string; foreground: string; border: string };
      destructive: { background: string; foreground: string; border: string };
    };
    card: {
      default: { background: string; border: string; radius: number };
      elevated: {
        background: string;
        border: string;
        radius: number;
        shadow: "md";
      };
      dark: {
        background: string;
        foreground: string;
        border: string;
        radius: number;
      };
      media: {
        background: string;
        radius: number;
        overlayOpacity: number;
      };
    };
    chip: {
      default: {
        background: string;
        foreground: string;
        border: string;
        radius: number;
      };
      selected: {
        background: string;
        foreground: string;
        border: string;
        radius: number;
      };
      sport: { radius: number };
    };
    badge: {
      sport: { radius: number };
      status: {
        radius: number;
        success: string;
        warning: string;
        destructive: string;
      };
    };
  };
  legacy: {
    palette: {
      primary: string;
      secondary: string;
      tertiary: string;
      neutral: string;
      white: string;
      black: string;
      success: string;
      warning: string;
    };
    scheme: LegacyScheme;
    navy: string;
    navyMuted: string;
    navySurface: string;
    navyRaised: string;
    navyHighlight: string;
    navyCanvas: string;
    navySearch: string;
  };
};

declare const tokens: DesignTokens;
export default tokens;
