import { colors } from "@/constants/colors";
import { FEATURE_FLAGS } from "@/constants/feature-flags";
import { AnimatedSplashScreen } from "@/components/animated-splash-screen";
import { AppProviders } from "@/contexts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { configureForegroundNotifications } from "@/services/push-notifications-service";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  // Auth gate önce çalışsın; (tabs) erken mount → çift fetch'i önler.
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();
configureForegroundNotifications();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Anybody_600SemiBold: require("@expo-google-fonts/anybody/600SemiBold/Anybody_600SemiBold.ttf"),
    Anybody_700Bold: require("@expo-google-fonts/anybody/700Bold/Anybody_700Bold.ttf"),
    HankenGrotesk_500Medium: require("@expo-google-fonts/hanken-grotesk/500Medium/HankenGrotesk_500Medium.ttf"),
    HankenGrotesk_700Bold: require("@expo-google-fonts/hanken-grotesk/700Bold/HankenGrotesk_700Bold.ttf"),
    JetBrainsMono_500Medium: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
    JetBrainsMono_700Bold: require("@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf"),
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
  const colorScheme = useColorScheme();
  const appColors = colors[colorScheme];
  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ThemeProvider
          value={{
            ...navigationTheme,
            colors: {
              ...navigationTheme.colors,
              background: appColors.background,
              card: appColors.surface,
              border: appColors.border,
              notification: appColors.tint,
              primary: appColors.tint,
              text: appColors.text,
            },
          }}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(first-launch)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="events" />
            <Stack.Screen name="users/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="friends" />
            <Stack.Screen name="conversations" />
            <Stack.Screen name="people" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="posts" />
            <Stack.Screen name="badges" />
            {FEATURE_FLAGS.albums ? <Stack.Screen name="albums" /> : null}
            <Stack.Screen name="report" />
            <Stack.Screen name="help" />
          </Stack>
        </ThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
