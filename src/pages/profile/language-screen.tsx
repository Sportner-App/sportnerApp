import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, ScreenHeader } from "@/components";
import { themeColors } from "@/constants/theme";
import { useLanguagePreference } from "@/contexts";
import type { LanguagePreference } from "@/contexts/language-preference-provider";

const ICONS_BY_KEY: Record<LanguagePreference, "mobile-screen" | "globe"> = {
  system: "mobile-screen",
  tr: "globe",
  en: "globe",
};

export function LanguageScreen() {
  const { t } = useTranslation("settings");
  const { preference, setPreference } = useLanguagePreference();

  const OPTIONS: {
    key: LanguagePreference;
    label: string;
    description: string;
    icon: "mobile-screen" | "globe";
  }[] = (["system", "tr", "en"] as const).map((key) => ({
    key,
    label: t(`language.options.${key}.label`),
    description: t(`language.options.${key}.description`),
    icon: ICONS_BY_KEY[key],
  }));

  return (
    <AppScreen
      tone="light"
      header={
        <ScreenHeader title={t("language.title")} showBack tone="light" />
      }
      contentClassName="px-5 pt-4"
    >
      <Text className="mb-3 font-body text-sm leading-5 text-text-secondary">
        {t("language.description")}
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
