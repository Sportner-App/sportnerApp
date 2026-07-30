import { colors } from "@/shared/config/colors";

export const fonts = {
  display: "Anybody_700Bold",
  displayMedium: "Anybody_600SemiBold",
  body: "HankenGrotesk_500Medium",
  bodyStrong: "HankenGrotesk_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoStrong: "JetBrainsMono_700Bold",
};

export const fontSizes = {
  label: 13,
  body: 15,
  bodyLarge: 17,
  title: 28,
  hero: 36,
  metric: 22,
};

export const radii = {
  card: 24,
  pill: 999,
};

export const spacing = {
  screen: 20,
  section: 16,
  card: 18,
};

export const shadows = {
  card: {
    shadowColor: "#020617",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

export const appTheme = {
  colors,
  fonts,
  fontSizes,
  radii,
  spacing,
  shadows,
};
