import { AppProviders } from "@/app-core/providers";
import { colors } from "@/shared/config/colors";
import { useColorScheme } from "@/shared/lib/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Anybody_600SemiBold: require("@expo-google-fonts/anybody/600SemiBold/Anybody_600SemiBold.ttf"),
    Anybody_700Bold: require("@expo-google-fonts/anybody/700Bold/Anybody_700Bold.ttf"),
    HankenGrotesk_500Medium: require("@expo-google-fonts/hanken-grotesk/500Medium/HankenGrotesk_500Medium.ttf"),
    HankenGrotesk_700Bold: require("@expo-google-fonts/hanken-grotesk/700Bold/HankenGrotesk_700Bold.ttf"),
    JetBrainsMono_500Medium: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
    JetBrainsMono_700Bold: require("@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const appColors = colors[colorScheme];
  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="events/create" options={{ headerShown: false }} />
          <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
