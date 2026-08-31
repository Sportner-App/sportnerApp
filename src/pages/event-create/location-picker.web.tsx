import { Text, View } from "react-native";

import { themeColors } from "@/constants/theme";
import type { SelectedLocation } from "@/types/location";

type LocationPickerProps = {
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  onSelect: (location: SelectedLocation) => void;
  compact?: boolean;
};

export function LocationPicker({
  addressText,
  compact = false,
}: LocationPickerProps) {
  return (
    <View
      className={`justify-center rounded-[28px] border border-border-default bg-surface-primary px-4 ${compact ? "h-40" : "h-56"}`}
    >
      <Text
        className="font-body text-sm"
        style={{ color: themeColors.text.secondary }}
      >
        Harita bu ortamda kullanılamıyor.
      </Text>
      {addressText ? (
        <Text
          className="mt-2 font-body text-sm"
          style={{ color: themeColors.text.primary }}
        >
          {addressText}
        </Text>
      ) : null}
    </View>
  );
}
