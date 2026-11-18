import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import { themeColors } from "@/constants/theme";

export function OrganizationVisibilityPicker({
  isPublic,
  onChange,
}: {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}) {
  const { t } = useTranslation("organizations");
  const options = [
    {
      value: true,
      icon: "globe" as const,
      title: t("visibility.public"),
      description: t("visibility.publicDescription"),
    },
    {
      value: false,
      icon: "lock" as const,
      title: t("visibility.private"),
      description: t("visibility.privateDescription"),
    },
  ];

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label text-text-secondary">
        {t("visibility.label")}
      </Text>
      <View className="flex-row gap-3">
        {options.map((option) => {
          const selected = isPublic === option.value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              className={`flex-1 gap-2 rounded-2xl border p-3.5 active:opacity-80 ${
                selected
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-border-default bg-surface-primary"
              }`}
            >
              <FontAwesome6
                name={option.icon}
                size={16}
                color={
                  selected
                    ? themeColors.brand.primary
                    : themeColors.text.tertiary
                }
              />
              <Text className="font-body-bold text-body-sm text-text-primary">
                {option.title}
              </Text>
              <Text className="font-body text-caption leading-4 text-text-secondary">
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
