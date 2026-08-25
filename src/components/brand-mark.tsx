import { Text, View } from "react-native";

import type { BrandMarkProps } from "@/types/components";

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      className={`flex-row items-center gap-3 ${className ?? ""}`}
    >
      <View className="h-3.5 w-3.5 rounded-full bg-brand-primary" />
      <Text className="font-mono text-[18px] tracking-[10px] text-white/85">
        SPORTNER
      </Text>
    </View>
  );
}
