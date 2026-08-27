import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DatePickerSheet } from "@/components/date-picker-sheet";
import { themeColors } from "@/constants/theme";
import type { DateFieldProps } from "@/types/components";

function formatEventDate(date: Date) {
  return date.toLocaleString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DateField({
  label = "Tarih & Saat",
  value,
  onChange,
  minimumDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-[13px] text-text-secondary">
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3.5 active:bg-surface-secondary"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10">
          <FontAwesome6
            name="calendar-days"
            size={14}
            color={themeColors.brand.primary}
          />
        </View>
        <Text className="flex-1 font-body text-base text-text-primary">
          {formatEventDate(value)}
        </Text>
        <FontAwesome6
          name="chevron-down"
          size={11}
          color={themeColors.text.tertiary}
        />
      </Pressable>

      <DatePickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        minimumDate={minimumDate}
      />
    </View>
  );
}
