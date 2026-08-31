export const DARK_THEME_COLORS = {
  brand: { primary: "#ccff00" },
  background: {
    primary: "#06111a",
    secondary: "#091722",
    oliveTop: "#06111a",
    oliveMiddle: "#0a1822",
    oliveBottom: "#102431",
  },
  surface: { primary: "#0d1b27", secondary: "#152635", dark: "#1c1917" },
  text: {
    primary: "#f4f6f2",
    secondary: "#a8b2b8",
    tertiary: "#6f7d86",
    inverse: "#f4f6f2",
    onPrimary: "#06111a",
  },
  border: { default: "#203443", strong: "#345064" },
  overlay: { dark: "rgba(2, 8, 13, 0.58)" },
  success: "#5eead4",
  warning: "#fda4af",
  destructive: "#ef4444",
} as const;

export const LIGHT_THEME_COLORS = {
  brand: { primary: "#8fb300" },
  background: {
    primary: "#f5f7f2",
    secondary: "#edf1e8",
    oliveTop: "#f5f7f2",
    oliveMiddle: "#eef3e8",
    oliveBottom: "#e6ecdf",
  },
  surface: { primary: "#ffffff", secondary: "#e8ede4", dark: "#172018" },
  text: {
    primary: "#172018",
    secondary: "#526057",
    tertiary: "#7c8980",
    inverse: "#f8faf7",
    onPrimary: "#172018",
  },
  border: { default: "#d9e0d5", strong: "#bcc8b7" },
  overlay: { dark: "rgba(12, 20, 14, 0.48)" },
  success: "#0f8b76",
  warning: "#d85b70",
  destructive: "#dc2626",
} as const;

export type ThemePreference = "system" | "light" | "dark";
