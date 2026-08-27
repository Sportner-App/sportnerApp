import { Text, View } from "react-native";

import type { BrandMarkProps } from "@/types/components";

export function BrandMark({ className, tone = "dark" }: BrandMarkProps) {
  const isLight = tone === "light";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      className={`flex-row items-center gap-3 ${className ?? ""}`}
    >
      <View className="h-3.5 w-3.5 rounded-full bg-brand-primary" />
      <Text
        className={
          isLight
            ? "font-display text-[18px] tracking-[6px] text-text-primary"
            : "font-mono text-[18px] tracking-[10px] text-white/85"
        }
      >
        SPORTNER
      </Text>
    </View>
  );
}
