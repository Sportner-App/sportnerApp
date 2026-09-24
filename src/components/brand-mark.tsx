import { Image, View } from "react-native";

import type { BrandMarkProps } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

const LOGO_MARK = require("../../assets/images/icon-removebg.png");

export function BrandMark({
  className,
  tone = "dark",
  iconSize = 40,
  textSize,
  letterSpacing,
  gap = 8,
}: BrandMarkProps) {
  const isLight = tone === "light";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      className={`flex-row items-center ${className ?? ""}`}
      style={{ gap }}
    >
      <Image
        source={LOGO_MARK}
        className="rounded-md"
        resizeMode="cover"
        style={{ width: iconSize, height: iconSize }}
      />
      <Text
        numberOfLines={1}
        className={
          isLight
            ? "font-display text-heading-sm text-text-primary"
            : "font-mono text-heading-sm text-white/85"
        }
        style={{
          flexShrink: 1,
          fontSize: textSize,
          lineHeight: textSize ? textSize + 4 : undefined,
          letterSpacing: letterSpacing ?? (isLight ? 7 : 11),
        }}
      >
        SPORTNER
      </Text>
    </View>
  );
}
