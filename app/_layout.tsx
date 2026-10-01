import {
  edgeBackStackOptions,
  fullScreenBackStackOptions,
} from "@/constants/navigation";
import { AnimatedSplashScreen } from "@/components/animated-splash-screen";
import { AppProviders } from "@/contexts";
import { LanguagePreferenceProvider } from "@/contexts/language-preference-provider";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "@/contexts/theme-preference-provider";
import {
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
} from "@/constants/theme-palettes";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  KeyboardProvider,
  KeyboardToolbar,
  type KeyboardToolbarProps,
} from "react-native-keyboard-controller";
import "react-native-reanimated";
import "../global.css";
import { configureForegroundNotifications } from "@/services/push-notifications-service";
import { configureMapbox } from "@/services/mapbox";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  // Auth gate önce çalışsın; (tabs) erken mount → çift fetch'i önler.
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();
configureForegroundNotifications();
configureMapbox();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [loaded, error] = useFonts({
    ArchivoExpanded_700Bold: require("../assets/fonts/archivo/ArchivoExpanded-Bold.ttf"),
    ArchivoExpanded_800ExtraBold: require("../assets/fonts/archivo/ArchivoExpanded-ExtraBold.ttf"),
    Archivo_500Medium: require("@expo-google-fonts/archivo/500Medium/Archivo_500Medium.ttf"),
    Archivo_700Bold: require("@expo-google-fonts/archivo/700Bold/Archivo_700Bold.ttf"),
  });

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!splashDone) {
    return <AnimatedSplashScreen onFinish={handleSplashFinish} />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <LanguagePreferenceProvider>
      <ThemePreferenceProvider>
        <ThemedRootLayoutNav />
      </ThemePreferenceProvider>
    </LanguagePreferenceProvider>
  );
}

function ThemedRootLayoutNav() {
  const { t } = useTranslation("common");
  const { resolvedScheme: colorScheme } = useThemePreference();
  const appColors =
    colorScheme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <AppProviders>
          <ThemeProvider
            value={{
              ...navigationTheme,
              colors: {
                ...navigationTheme.colors,
                background: appColors.background.primary,
                card: appColors.surface.primary,
                border: appColors.border.default,
                notification: appColors.brand.primary,
                primary: appColors.brand.primary,
                text: appColors.text.primary,
              },
            }}
          >
            <Stack screenOptions={fullScreenBackStackOptions}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(first-launch)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(verify-email)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="events" options={edgeBackStackOptions} />
              <Stack.Screen name="users/[id]" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="friends" />
              <Stack.Screen name="conversations" />
              <Stack.Screen name="people" />
              <Stack.Screen name="feed" />
              <Stack.Screen name="posts" />
              <Stack.Screen name="badges" />
              <Stack.Screen name="albums" />
              <Stack.Screen name="report" />
              <Stack.Screen name="help" />
            </Stack>
            <KeyboardToolbar
              doneText={t("close")}
              theme={keyboardToolbarTheme}
            />
          </ThemeProvider>
        </AppProviders>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const keyboardToolbarTheme: KeyboardToolbarProps["theme"] = {
  light: {
    primary: LIGHT_THEME_COLORS.text.primary,
    disabled: LIGHT_THEME_COLORS.text.tertiary,
    background: LIGHT_THEME_COLORS.background.secondary,
    ripple: LIGHT_THEME_COLORS.border.strong,
  },
  dark: {
    primary: DARK_THEME_COLORS.text.primary,
    disabled: DARK_THEME_COLORS.text.tertiary,
    background: DARK_THEME_COLORS.surface.secondary,
    ripple: DARK_THEME_COLORS.border.strong,
  },
};
