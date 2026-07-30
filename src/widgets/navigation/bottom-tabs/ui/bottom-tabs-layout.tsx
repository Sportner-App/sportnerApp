import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";

import { colors } from "@/shared/config/colors";
import { appTheme } from "@/shared/config/theme";
import { useColorScheme } from "@/shared/lib/use-color-scheme";

export function BottomTabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors[colorScheme].tint,
        tabBarInactiveTintColor: colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors[colorScheme].surface,
          borderTopColor: colors[colorScheme].border,
        },
        headerStyle: {
          backgroundColor: colors[colorScheme].background,
        },
        headerTintColor: colors[colorScheme].text,
        headerShadowVisible: false,
        tabBarLabelStyle: {
          fontFamily: appTheme.fonts.mono,
          fontSize: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Antrenmanlar",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="dumbbell" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Ilerleme",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="chart-column" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gear" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
