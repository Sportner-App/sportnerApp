import { Image, View } from "react-native";

import type { BrandMarkProps } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

const LOGO_MARK = require("../../assets/images/icon-removebg.png");

export function BrandMark({ className, tone = "dark" }: BrandMarkProps) {
  const isLight = tone === "light";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      className={`flex-row items-center gap-2 ${className ?? ""}`}
    >
      <Image
        source={LOGO_MARK}
        className="h-10 w-10 rounded-md"
        resizeMode="cover"
      />
      <Text
        className={
          isLight
            ? "font-display text-heading-sm tracking-[7px] text-text-primary"
            : "font-mono text-heading-sm tracking-[11px] text-white/85"
        }
      >
        SPORTNER
      </Text>
    </View>
  );
}
