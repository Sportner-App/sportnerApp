import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import {
  FALLBACK_SPORT_IMAGE,
  resolveEventPhoto,
} from "@/constants/sport-images";
import { sportAccentToken, themeColors } from "@/constants/theme";
import type { EventDetail } from "@/types/events";

/** Fotoğrafın üzerine serilen karartma rengi (arka plan paletinin en koyu tonu). */
const SCRIM = "#02080d";

/** Tüm fotoğrafı eşit biçimde soğutan sabit peçe; gradient bunun üstüne biner. */
const BASE_VEIL = 0.58;

export function EventDetailBackdrop({ event }: { event: EventDetail }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const accent = sportAccentToken(event.sport);
  const base = accent?.soft ?? themeColors.surface.secondary;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: base }]}
      onLayout={(layoutEvent) => {
        const { width, height } = layoutEvent.nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({ width, height });
        }
      }}
    >
      <BackdropPhoto
        image={resolveEventPhoto(event.sportCoverImageUrl)}
        width={size.width}
        height={size.height}
      />
      <BackdropScrim
        fadeId={event.id}
        width={size.width}
        height={size.height}
      />
    </View>
  );
}

function BackdropPhoto({
  image,
  width,
  height,
}: {
  image: ReturnType<typeof resolveEventPhoto>;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Image
      source={failed ? FALLBACK_SPORT_IMAGE : image}
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={{ position: "absolute", top: 0, left: 0, width, height }}
    />
  );
}

function BackdropScrim({
  fadeId,
  width,
  height,
}: {
  fadeId: string;
  width: number;
  height: number;
}) {
  const gradientId = `event-backdrop-${fadeId}`;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: SCRIM, opacity: BASE_VEIL },
        ]}
      />
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {/* Status bar + cam butonlar */}
            <Stop offset="0" stopColor={SCRIM} stopOpacity="0.66" />
            {/* Fotoğrafın en açık kaldığı bant */}
            <Stop offset="0.16" stopColor={SCRIM} stopOpacity="0.28" />
            {/* Başlık ve meta satırı */}
            <Stop offset="0.4" stopColor={SCRIM} stopOpacity="0.42" />
            {/* Kartların başladığı yer: ayrı panel yok, karartmayı buradan alıyoruz. */}
            <Stop offset="0.72" stopColor={SCRIM} stopOpacity="0.7" />
            <Stop offset="1" stopColor={SCRIM} stopOpacity="0.88" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
}
