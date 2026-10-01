import tokens, { type DesignTokens } from "./design-tokens";

export type ThemeColors = DesignTokens["colors"];

/**
 * Koyu tema `design-tokens.js`'ten türetilir. Derin kopya şart: tema sağlayıcı
 * `themeColors`'u (aynı obje) yerinde değiştirdiği için referans paylaşılırsa
 * açık temaya geçişte koyu palet de ezilir.
 */
export const DARK_THEME_COLORS: ThemeColors = JSON.parse(
  JSON.stringify(tokens.colors),
);

export const LIGHT_THEME_COLORS: ThemeColors = {
  brand: { primary: "#8fb300" },
  action: { primary: "#8fb300", onPrimary: "#172018" },
  background: { primary: "#f5f7f2", secondary: "#edf1e8" },
  surface: { primary: "#ffffff", secondary: "#e8ede4" },
  text: {
    primary: "#172018",
    secondary: "#526057",
    tertiary: "#7c8980",
    inverse: "#f8faf7",
    onPrimary: "#172018",
  },
  border: { default: "#d9e0d5", strong: "#bcc8b7" },
  overlay: {
    dark: "rgba(12, 20, 14, 0.48)",
    photo: "rgba(6, 17, 26, 0.72)",
  },
  success: "#0f8b76",
  warning: "#d85b70",
  destructive: "#dc2626",
};

export type ThemePreference = "light" | "dark";
