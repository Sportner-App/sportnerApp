import { Fragment } from "react";
import { Image, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { AppText as Text } from "@/components";
import { fonts, palette } from "@/constants/theme";

const LOGO = require("../../../../assets/images/icon.png");

/** Posterin sağ üst köşesindeki küçük marka imzası. */
export function PosterBrand() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sportner"
      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <Image source={LOGO} style={{ width: 20, height: 20, borderRadius: 5 }} />
      <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 12, color: palette.ink }}>
        Sportner
      </Text>
    </View>
  );
}

/** Karşılıklı köşelerden yayılan yumuşak lime ışık; yazıların okunurluğunu bozmaz. */
export function PosterGlow() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="recap-glow" cx="100%" cy="0%" r="100%">
            <Stop offset="0" stopColor={palette.lime} stopOpacity={0.26} />
            <Stop offset="1" stopColor={palette.lime} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="recap-glow-low" cx="0%" cy="100%" r="80%">
            <Stop offset="0" stopColor={palette.lime} stopOpacity={0.12} />
            <Stop offset="1" stopColor={palette.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#recap-glow)" />
        <Rect width="100%" height="100%" fill="url(#recap-glow-low)" />
      </Svg>
    </View>
  );
}

/** Skor tabelası gibi tek şerit: kutular yerine ince çizgilerle ayrılmış sayılar. */
export function PosterStatStrip({
  stats,
  compact = false,
}: {
  stats: { value: string; label: string }[];
  compact?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: palette.line,
        paddingVertical: 12,
      }}
    >
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? (
            <View style={{ width: 1, marginHorizontal: compact ? 8 : 12, backgroundColor: palette.line }} />
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: compact ? 22 : 26, color: palette.ink }}>
              {stat.value}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontFamily: fonts.body, fontSize: compact ? 10 : 11, color: palette.inkMuted }}
            >
              {stat.label}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
