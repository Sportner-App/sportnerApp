import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DatePickerSheet } from "@/components/date-picker-sheet";
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
      <Text className="font-body text-sm text-brand-neutral">{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5 active:opacity-80"
      >
        <FontAwesome6 name="calendar-days" size={15} color="#ccff00" />
        <Text className="flex-1 font-body text-base text-white">
          {formatEventDate(value)}
        </Text>
        <FontAwesome6 name="chevron-down" size={12} color="#64748b" />
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
