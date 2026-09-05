import { Pressable, ScrollView, Text } from "react-native";

import { themeColors } from "@/constants/theme";
import type { SportCategory } from "@/types/sports";

type CategoryFilterProps = {
  categories: SportCategory[];
  /** Seçili kategori id'si; null = Tümü */
  value: string | null;
  onChange: (categoryId: string | null) => void;
};

/** Ana sayfadaki hızlı kategori filtresi (Tümü + katalog kategorileri). */
export function SportFilter({
  categories,
  value,
  onChange,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-sm pr-xl"
    >
      <CategoryChip
        label="Tümü"
        isActive={value === null}
        onPress={() => onChange(null)}
      />

      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          label={category.name}
          isActive={category.id === value}
          onPress={() => onChange(category.id)}
        />
      ))}
    </ScrollView>
  );
}

function CategoryChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      className={`rounded-pill border px-lg py-sm ${
        isActive
          ? "border-brand-primary bg-brand-primary"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text
        numberOfLines={1}
        className="font-body text-sm font-semibold"
        style={{
          color: isActive
            ? themeColors.text.onPrimary
            : themeColors.text.secondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
