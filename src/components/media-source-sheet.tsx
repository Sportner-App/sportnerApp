import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BottomSheet } from "@/components/bottom-sheet";
import { useMediaSourceOptions } from "@/constants/components";
import { themeColors } from "@/constants/theme";
import type { MediaSource } from "@/utils/media-picker";

type MediaSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: MediaSource) => void;
};

export function MediaSourceSheet({
  visible,
  onClose,
  onSelect,
}: MediaSourceSheetProps) {
  const { t } = useTranslation("components");
  const options = useMediaSourceOptions();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("mediaSource.title")}
      subtitle={t("mediaSource.subtitle")}
    >
      <View className="gap-2">
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3.5 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15">
              <FontAwesome6
                name={option.icon}
                size={15}
                color={themeColors.brand.primary}
              />
            </View>
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-text-primary">
                {option.label}
              </Text>
              <Text className="mt-0.5 font-body text-xs text-text-secondary">
                {option.description}
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              size={11}
              color={themeColors.text.tertiary}
            />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
