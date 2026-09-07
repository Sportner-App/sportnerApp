import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BottomSheet } from "@/components/bottom-sheet";
import { useDirectionsOptions } from "@/constants/components";
import {
  openDirections,
  type DirectionsTarget,
} from "@/utils/open-directions";

type DirectionsSheetProps = {
  visible: boolean;
  target: DirectionsTarget | null;
  onClose: () => void;
};

export function DirectionsSheet({
  visible,
  target,
  onClose,
}: DirectionsSheetProps) {
  const { t } = useTranslation("components");
  const options = useDirectionsOptions();

  const handleSelect = async (app: (typeof options)[number]["key"]) => {
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
      title={t("directions.title")}
      subtitle={t("directions.subtitle")}
    >
      <View className="gap-2">
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => void handleSelect(option.key)}
            className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-background-secondary px-4 py-3.5 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
              <FontAwesome6 name={option.icon} size={16} color="#ccff00" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-text-primary">
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
