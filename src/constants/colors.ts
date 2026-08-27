import tokens from "./design-tokens";

/**
 * Legacy palette used by existing screens and NativeWind `brand-*` classes.
 * New UI should prefer `themeColors` / `appTheme` from `@/constants/theme`.
 */
export const colorPalette = tokens.legacy.palette;

export const colors = {
  light: { ...tokens.legacy.scheme },
  dark: { ...tokens.legacy.scheme },
};

export {
  componentTokens,
  media,
  palette,
  radius,
  shadows,
  spacing,
  sportAccents,
  themeColors,
  typography,
} from "./theme";
