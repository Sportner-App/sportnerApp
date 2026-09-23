import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";

type EventCreateProgressProps = {
  step: 1 | 2 | 3 | 4 | 5;
};

export function EventCreateProgress({ step }: EventCreateProgressProps) {
  const { t } = useTranslation("eventCreate");
  const STEPS: { step: 1 | 2 | 3 | 4 | 5; label: string; icon: IconName }[] = [
    { step: 1, label: t("progress.details"), icon: "pen" },
    { step: 2, label: t("progress.location"), icon: "location-dot" },
    { step: 3, label: t("progress.plan"), icon: "calendar-days" },
    { step: 4, label: t("progress.capacity"), icon: "users" },
    { step: 5, label: t("progress.roster"), icon: "check" },
  ];

  return (
    <View className="flex-row rounded-[22px] border border-border-default bg-surface-primary/90 p-1.5">
      {STEPS.map((item) => {
        const active = item.step === step;
        const complete = item.step < step;

        return (
          <View
            key={item.step}
            accessibilityLabel={item.label}
            className={`min-h-[46px] flex-1 items-center justify-center rounded-[17px] ${
              active ? "bg-brand-primary" : "bg-transparent"
            }`}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-full border ${
                active
                  ? "border-black/10 bg-black/10"
                  : complete
                    ? "border-brand-primary/40 bg-brand-primary/15"
                    : "border-border-default bg-surface-secondary"
              }`}
            >
              <FontAwesome6
                name={complete ? "check" : item.icon}
                size={10}
                color={
                  active
                    ? themeColors.text.onPrimary
                    : complete
                      ? themeColors.brand.primary
                      : themeColors.text.tertiary
                }
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
