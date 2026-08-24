import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import type { IconName } from "@/types/components";
import {
  openDirections,
  type DirectionsApp,
  type DirectionsTarget,
} from "@/utils/open-directions";

type DirectionsSheetProps = {
  visible: boolean;
  target: DirectionsTarget | null;
  onClose: () => void;
};

type DirectionsOption = {
  key: DirectionsApp;
  label: string;
  description: string;
  icon: IconName;
};

const OPTIONS: DirectionsOption[] = [
  {
    key: "apple",
    label: "Apple Haritalar",
    description: "Apple Maps ile git",
    icon: "apple",
  },
  {
    key: "google",
    label: "Google Maps",
    description: "Google ile yol tarifi",
    icon: "google",
  },
  {
    key: "yandex",
    label: "Yandex Haritalar",
    description: "Yandex ile yol tarifi",
    icon: "diamond-turn-right",
  },
];

export function DirectionsSheet({
  visible,
  target,
  onClose,
}: DirectionsSheetProps) {
  const handleSelect = async (app: DirectionsApp) => {
    if (!target) {
      return;
    }

    onClose();
    await openDirections(app, target);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Yol tarifi"
      subtitle="Harita uygulaması seç"
    >
      <View className="gap-2">
        {OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => void handleSelect(option.key)}
            className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-secondary/70 px-4 py-3.5 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
              <FontAwesome6 name={option.icon} size={16} color="#ccff00" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-white">
                {option.label}
              </Text>
              <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                {option.description}
              </Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color="#64748b" />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
