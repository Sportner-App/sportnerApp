import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";

type EventCreateProgressProps = {
  step: 1 | 2 | 3 | 4;
};

const STEPS: { step: 1 | 2 | 3 | 4; label: string; icon: IconName }[] = [
  { step: 1, label: "Detaylar", icon: "pen" },
  { step: 2, label: "Plan", icon: "location-dot" },
  { step: 3, label: "Kapasite", icon: "users" },
  { step: 4, label: "Kadro", icon: "check" },
];

export function EventCreateProgress({ step }: EventCreateProgressProps) {
  return (
    <View className="flex-row rounded-[22px] border border-border-default bg-surface-primary/90 p-1.5">
      {STEPS.map((item) => {
        const active = item.step === step;
        const complete = item.step < step;

        return (
          <View
            key={item.step}
            className={`min-h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-[17px] ${
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
            <Text
              className="font-body-bold text-[11px]"
              style={{
                color: active
                  ? themeColors.text.onPrimary
                  : complete
                    ? themeColors.text.primary
                    : themeColors.text.secondary,
              }}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
