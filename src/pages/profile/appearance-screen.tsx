import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

import { AppScreen, ScreenHeader } from "@/components";
import { themeColors } from "@/constants/theme";
import type { ThemePreference } from "@/constants/theme-palettes";
import { useThemePreference } from "@/contexts";

const OPTIONS: {
  key: ThemePreference;
  label: string;
  description: string;
  icon: "mobile-screen" | "sun" | "moon";
}[] = [
  {
    key: "system",
    label: "Sistem",
    description: "Telefonunun görünüm ayarını takip eder",
    icon: "mobile-screen",
  },
  {
    key: "light",
    label: "Açık",
    description: "Her zaman açık temayı kullanır",
    icon: "sun",
  },
  {
    key: "dark",
    label: "Koyu",
    description: "Her zaman koyu temayı kullanır",
    icon: "moon",
  },
];

export function AppearanceScreen() {
  const { preference, setPreference } = useThemePreference();

  return (
    <AppScreen
      tone="light"
      header={<ScreenHeader title="Görünüm" showBack tone="light" />}
      contentClassName="px-5 pt-4"
    >
      <Text className="mb-3 font-body text-sm leading-5 text-text-secondary">
        Sportner’ın görünümünü seç. Sistem seçeneği telefonundaki tema
        değişikliklerini otomatik uygular.
      </Text>
      <View className="overflow-hidden rounded-[24px] border border-border-default bg-surface-primary">
        {OPTIONS.map((option, index) => {
          const selected = preference === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setPreference(option.key)}
              className={`flex-row items-center gap-4 px-4 py-4 active:bg-surface-secondary ${index < OPTIONS.length - 1 ? "border-b border-border-default" : ""}`}
            >
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-brand-primary" : "bg-surface-secondary"}`}
              >
                <FontAwesome6
                  name={option.icon}
                  size={14}
                  color={
                    selected
                      ? themeColors.text.onPrimary
                      : themeColors.text.secondary
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-sm text-text-primary">
                  {option.label}
                </Text>
                <Text className="mt-1 font-body text-xs text-text-tertiary">
                  {option.description}
                </Text>
              </View>
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-brand-primary" : "border-border-strong"}`}
              >
                {selected ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}
