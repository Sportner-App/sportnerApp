import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { AppText as Text, Avatar } from "@/components";
import {
  FALLBACK_SPORT_IMAGE,
  resolveEventPhoto,
} from "@/features/sports/sport-images";
import type { IconName } from "@/types/components";
import type { ParticipantAvatarPreview } from "@/features/events/types";

// Fotoğraf üzerindeki içerik her iki temada da koyu overlay üzerinde okunur.
export const MIST = "#06111a";

export function MetaItem({
  icon,
  label,
  accent,
}: {
  icon: IconName;
  label: string;
  accent?: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <FontAwesome6 name={icon} size={12} color={accent ?? "#cbd5e1"} />
      <Text
        numberOfLines={1}
        className="max-w-[200px] font-body-bold text-label text-white"
      >
        {label}
      </Text>
    </View>
  );
}

export function MistOverlay({
  fadeId,
  width,
  height,
}: {
  fadeId: string;
  width: number;
  height: number;
}) {
  const radialLeftId = `mist-radial-left-${fadeId}`;
  const radialRightId = `mist-radial-right-${fadeId}`;
  const leftId = `mist-left-${fadeId}`;
  const bottomId = `mist-bottom-${fadeId}`;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient
            id={radialLeftId}
            cx="12%"
            cy="78%"
            rx="72%"
            ry="108%"
            fx="12%"
            fy="78%"
          >
            <Stop offset="0" stopColor={MIST} stopOpacity="0.94" />
            <Stop offset="0.35" stopColor={MIST} stopOpacity="0.62" />
            <Stop offset="0.62" stopColor={MIST} stopOpacity="0.02" />
            <Stop offset="1" stopColor={MIST} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id={radialRightId}
            cx="92%"
            cy="92%"
            rx="36%"
            ry="64%"
            fx="92%"
            fy="92%"
          >
            <Stop offset="0" stopColor={MIST} stopOpacity="0.9" />
            <Stop offset="0.45" stopColor={MIST} stopOpacity="0.48" />
            <Stop offset="0.78" stopColor={MIST} stopOpacity="0.1" />
            <Stop offset="1" stopColor={MIST} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={leftId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={MIST} stopOpacity="0.68" />
            <Stop offset="0.28" stopColor={MIST} stopOpacity="0.18" />
            <Stop offset="0.5" stopColor={MIST} stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id={bottomId} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={MIST} stopOpacity="0.28" />
            <Stop offset="0.1" stopColor={MIST} stopOpacity="0.48" />
            <Stop offset="0.22" stopColor={MIST} stopOpacity="0.12" />
            <Stop offset="0.32" stopColor={MIST} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${leftId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${bottomId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${radialLeftId})`}
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={`url(#${radialRightId})`}
        />
      </Svg>
    </View>
  );
}

export function SportPhoto({
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
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: "transparent",
      }}
    />
  );
}

export function ParticipantProof({
  occupied,
  avatars,
  soft,
  accent,
}: {
  occupied: number;
  avatars: ParticipantAvatarPreview[];
  soft: string;
  accent: string;
}) {
  const shown = occupied === 0 ? 1 : Math.min(occupied, 3);
  const extra = Math.max(occupied - 3, 0);
  const extraAvatar = avatars[3];

  return (
    <View className="flex-row items-center">
      {Array.from({ length: shown }, (_, index) => {
        const avatar = avatars[index];

        return (
          <View
            key={index}
            className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white"
            style={{
              marginLeft: index === 0 ? 0 : -10,
              backgroundColor: soft,
              zIndex: shown - index,
            }}
          >
            {avatar ? (
              <Avatar
                uri={avatar.avatarUrl}
                name={avatar.name}
                isGuest={avatar.isGuest}
                size={28}
                borderWidth={0}
                backgroundColor={soft}
                textColor={accent}
                previewable={false}
              />
            ) : index === 0 ? (
              <FontAwesome6 name="user-group" size={11} color={accent} />
            ) : null}
          </View>
        );
      })}
      {extra > 0 ? (
        <View
          className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white"
          style={{ marginLeft: -10, backgroundColor: soft, zIndex: 0 }}
        >
          {extraAvatar ? (
            <Avatar
              uri={extraAvatar.avatarUrl}
              name={extraAvatar.name}
              isGuest={extraAvatar.isGuest}
              size={28}
              borderWidth={0}
              backgroundColor={soft}
              textColor={accent}
              previewable={false}
            />
          ) : null}
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(6, 17, 26, 0.62)" }}
          >
            <Text className="font-body-bold text-overline text-white">
              +{extra}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
