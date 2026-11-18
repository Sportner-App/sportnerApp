import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import { themeColors } from "@/constants/theme";
import { ORGANIZATION_EVENT_POLICY } from "@/features/organizations/types";

export function OrganizationEventPolicyPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (policy: number) => void;
}) {
  const { t } = useTranslation("organizations");
  const options = [
    {
      value: ORGANIZATION_EVENT_POLICY.allMembers,
      icon: "users" as const,
      title: t("eventPolicy.allMembers"),
    },
    {
      value: ORGANIZATION_EVENT_POLICY.managersOnly,
      icon: "user-shield" as const,
      title: t("eventPolicy.managersOnly"),
    },
  ];

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label text-text-secondary">
        {t("eventPolicy.label")}
      </Text>
      <View className="flex-row gap-3">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
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
            </Pressable>
          );
        })}
      </View>
      <Text className="font-body text-caption leading-4 text-text-secondary">
        {value === ORGANIZATION_EVENT_POLICY.managersOnly
          ? t("eventPolicy.managersOnlyDescription")
          : t("eventPolicy.allMembersDescription")}
      </Text>
    </View>
  );
}
