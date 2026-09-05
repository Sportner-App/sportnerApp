import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SelectSheet } from "@/components/select-sheet";
import { themeColors } from "@/constants/theme";
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
  groups,
  allGroupLabel,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);
  const displayIcon = selected?.icon ?? icon;

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-[13px] text-text-secondary">
        {label}
      </Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3.5 active:bg-surface-secondary disabled:opacity-50"
      >
        {displayIcon ? (
          <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10">
            <FontAwesome6
              name={displayIcon}
              size={14}
              color={themeColors.brand.primary}
            />
          </View>
        ) : null}
        <Text
          className={`flex-1 font-body text-base ${
            selected ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {selected?.label ?? placeholder}
        </Text>
        <FontAwesome6
          name="chevron-down"
          size={11}
          color={themeColors.text.tertiary}
        />
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
        groups={groups}
        allGroupLabel={allGroupLabel}
      />
    </View>
  );
}
