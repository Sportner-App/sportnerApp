import tokens from "./design-tokens";
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from "./theme-palettes";

/**
 * Legacy palette used by existing screens and NativeWind `brand-*` classes.
 * New UI should prefer `themeColors` / `appTheme` from `@/constants/theme`.
 */
export const colorPalette = tokens.legacy.palette;

export const colors = {
  light: {
    text: LIGHT_THEME_COLORS.text.primary,
    background: LIGHT_THEME_COLORS.background.primary,
    surface: LIGHT_THEME_COLORS.surface.primary,
    tint: LIGHT_THEME_COLORS.brand.primary,
    icon: LIGHT_THEME_COLORS.text.secondary,
    tabIconDefault: LIGHT_THEME_COLORS.text.tertiary,
    tabIconSelected: LIGHT_THEME_COLORS.brand.primary,
    border: LIGHT_THEME_COLORS.border.default,
  },
  dark: {
    ...tokens.legacy.scheme,
    text: DARK_THEME_COLORS.text.primary,
    background: DARK_THEME_COLORS.background.primary,
    surface: DARK_THEME_COLORS.surface.primary,
    tint: DARK_THEME_COLORS.brand.primary,
    border: DARK_THEME_COLORS.border.default,
  },
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
