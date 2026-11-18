import { Pressable, View } from "react-native";

import { AppText as Text } from "@/components";
import { HIT_SLOP } from "@/constants/theme";

/** Minimal üst sekme: kenarlık/dolgu yok, yalnızca aktif olan öne çıkıyor. */
export function DiscoverModeTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View className="flex-row gap-5 px-5">
      {options.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            hitSlop={HIT_SLOP}
            onPress={() => onChange(option.key)}
            className="active:opacity-70"
          >
            <Text
              className={`font-body-bold text-body-sm ${
                active ? "text-text-primary" : "text-text-tertiary"
              }`}
            >
              {option.label}
            </Text>
            <View
              className={`mt-1.5 h-0.5 rounded-full ${
                active ? "bg-brand-primary" : "bg-transparent"
              }`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
