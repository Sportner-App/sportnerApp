import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme, vars } from "nativewind";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWindowDimensions, View } from "react-native";

import tokens from "@/constants/design-tokens";
import { themeColors } from "@/constants/theme";
import {
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
  type ThemeColors,
  type ThemePreference,
} from "@/constants/theme-palettes";

const STORAGE_KEY = "sportner:theme-preference";
const ThemePreferenceContext = createContext<{
  preference: ThemePreference;
  resolvedScheme: "light" | "dark";
  setPreference: (value: ThemePreference) => void;
} | null>(null);

function hexRgb(hex: string) {
  const value = hex.replace("#", "");
  return `${parseInt(value.slice(0, 2), 16)} ${parseInt(value.slice(2, 4), 16)} ${parseInt(value.slice(4, 6), 16)}`;
}

/**
 * Tema CSS değişkenleri. `width` verilirse ekran genişliğine göre ölçeklenen
 * `--text-*` / `--leading-*` font boyutları da eklenir.
 */
export function createThemeVariables(colors: ThemeColors, width?: number) {
  return vars({
    ...(width ? tokens.textSizeVariables(width) : {}),
    "--color-brand-primary": hexRgb(colors.brand.primary),
    "--color-action-primary": hexRgb(colors.action.primary),
    "--color-action-on-primary": hexRgb(colors.action.onPrimary),
    "--color-background-primary": hexRgb(colors.background.primary),
    "--color-background-secondary": hexRgb(colors.background.secondary),
    "--color-surface-primary": hexRgb(colors.surface.primary),
    "--color-surface-secondary": hexRgb(colors.surface.secondary),
    "--color-text-primary": hexRgb(colors.text.primary),
    "--color-text-secondary": hexRgb(colors.text.secondary),
    "--color-text-tertiary": hexRgb(colors.text.tertiary),
    "--color-text-inverse": hexRgb(colors.text.inverse),
    "--color-border-default": hexRgb(colors.border.default),
    "--color-border-strong": hexRgb(colors.border.strong),
  });
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const resolvedScheme = preference;
  const colors =
    resolvedScheme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  Object.assign(themeColors.brand, colors.brand);
  Object.assign(themeColors.action, colors.action);
  Object.assign(themeColors.background, colors.background);
  Object.assign(themeColors.surface, colors.surface);
  Object.assign(themeColors.text, colors.text);
  Object.assign(themeColors.border, colors.border);
  Object.assign(themeColors.overlay, colors.overlay);
  themeColors.success = colors.success;
  themeColors.warning = colors.warning;
  themeColors.destructive = colors.destructive;

  useEffect(() => {
    // Light theme is temporarily disabled; always stay on dark.
    // void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    //   if (stored === "light" || stored === "dark") setPreferenceState(stored);
    // });
    setPreferenceState("dark");
    void AsyncStorage.setItem(STORAGE_KEY, "dark");
  }, []);

  useEffect(() => {
    colorScheme.set(preference);
  }, [preference]);

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value);
    void AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const cssVariables = useMemo(
    () => createThemeVariables(colors, width),
    [colors, width],
  );

  const value = useMemo(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme],
  );
  return (
    <ThemePreferenceContext.Provider value={value}>
      <View className="flex-1" style={cssVariables}>
        {children}
      </View>
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);
  if (!value)
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider.",
    );
  return value;
}
