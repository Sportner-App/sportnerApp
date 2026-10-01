export type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
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
  // Takım sporları
  | "basketball"
  | "football"
  | "volleyball"
  | "handball"
  | "beachVolleyball"
  | "rugby"
  // Raket sporları
  | "tennis"
  | "tableTennis"
  | "badminton"
  | "padel"
  | "pickleball"
  | "squash"
  // Fitness & kondisyon
  | "fitness"
  | "crossfit"
  | "pilates"
  | "yoga"
  | "dance"
  // Dövüş sporları
  | "boxing"
  | "kickboxing"
  | "judo"
  | "jiuJitsu"
  | "karate"
  // Outdoor & dayanıklılık
  | "running"
  | "cycling"
  | "hiking"
  | "climbing"
  // Su sporları
  | "swimming"
  | "diving"
  | "sailing"
  | "rowing"
  // Kış sporları
  | "ski"
  | "snowboard"
  // Hedef sporları
  | "bowling"
  | "golf"
  | "archery";

export type DesignTokens = {
  palette: {
    lime: string;
    canvas: string;
    canvasRaised: string;
    surface: string;
    surfaceRaised: string;
    ink: string;
    inkMuted: string;
    inkSoft: string;
    line: string;
    lineStrong: string;
    white: string;
    overlay: string;
    photoScrim: string;
    success: string;
    warning: string;
    destructive: string;
  };
  colors: {
    brand: { primary: string };
    action: { primary: string; onPrimary: string };
    background: { primary: string; secondary: string };
    surface: { primary: string; secondary: string };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      onPrimary: string;
    };
    border: { default: string; strong: string };
    overlay: { dark: string; photo: string };
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
  };
  media: {
    cardRadius: number;
    overlayColor: string;
  };
};

declare const tokens: DesignTokens;
export default tokens;
