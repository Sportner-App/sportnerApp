import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SelectSheet } from "@/components/select-sheet";
import type { SelectFieldProps } from "@/types/components";

export function SelectField<T extends string>({
  label,
  placeholder = "Seç",
  options,
  value,
  onChange,
  sheetTitle,
  sheetSubtitle,
  icon,
  disabled = false,
  sheetVariant,
  searchable,
  searchPlaceholder,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);
  const displayIcon = selected?.icon ?? icon;

  return (
    <View className="gap-2">
      <Text className="font-body text-sm text-brand-neutral">{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5 active:opacity-80 disabled:opacity-50"
      >
        {displayIcon ? (
          <FontAwesome6 name={displayIcon} size={15} color="#ccff00" />
        ) : null}
        <Text
          className={`flex-1 font-body text-base ${
            selected ? "text-white" : "text-brand-neutral"
          }`}
        >
          {selected?.label ?? placeholder}
        </Text>
        <FontAwesome6 name="chevron-down" size={12} color="#64748b" />
      </Pressable>

      <SelectSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={sheetTitle ?? label}
        subtitle={sheetSubtitle}
        options={options}
        value={value}
        onChange={onChange}
        variant={sheetVariant}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
      />
    </View>
  );
}
