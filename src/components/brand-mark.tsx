import { Text, View } from "react-native";

import type { BrandMarkProps } from "@/types/components";

export function BrandMark({ className, tone = "dark" }: BrandMarkProps) {
  const isLight = tone === "light";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      className={className}
    >
      <Text
        className={
          isLight
            ? "font-display text-[20px] tracking-[7px] text-text-primary"
            : "font-mono text-[20px] tracking-[11px] text-white/85"
        }
      >
        SPORTNER
      </Text>
    </View>
  );
}
