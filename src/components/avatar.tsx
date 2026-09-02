import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import { resolveMediaUrl } from "@/utils/media-url";

import { AvatarPhotoPreview } from "./avatar-photo-preview";

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  isGuest?: boolean;
  fallbackIcon?: IconName;
  onPress?: () => void;
  previewable?: boolean;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Avatar({
  uri,
  name,
  size = 40,
  isGuest = false,
  fallbackIcon,
  onPress,
  previewable = true,
  borderColor = `${themeColors.brand.primary}66`,
  borderWidth = 1,
  backgroundColor = themeColors.surface.secondary,
  textColor = themeColors.brand.primary,
  style,
  accessibilityLabel,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedUri = uri ? resolveMediaUrl(uri) : null;

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUri]);

  const hasPhoto = Boolean(resolvedUri && !imageFailed);
  const canPreview = previewable && hasPhoto;
  const isInteractive = canPreview || Boolean(onPress);

  const containerStyle: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor,
      borderWidth,
      backgroundColor,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    style,
  ];

  const content =
    resolvedUri && !imageFailed ? (
      <Image
        source={{ uri: resolvedUri }}
        onError={() => setImageFailed(true)}
        style={{ width: "100%", height: "100%" }}
      />
    ) : isGuest || fallbackIcon ? (
      <FontAwesome6
        name={fallbackIcon ?? "user"}
        size={Math.max(size * 0.32, 10)}
        color={textColor}
      />
    ) : (
      <Text
        className="font-body-bold"
        style={{ color: textColor, fontSize: Math.max(size * 0.28, 10) }}
      >
        {initials(name)}
      </Text>
    );

  const handlePress = () => {
    if (canPreview) {
      setPreviewOpen(true);
      return;
    }

    onPress?.();
  };

  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    (canPreview
      ? `${name || "Kullanıcı"} profil fotoğrafını büyüt`
      : `${name || "Kullanıcı"} profili`);

  if (!isInteractive) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={resolvedAccessibilityLabel}
        onPress={handlePress}
        style={containerStyle}
        className="active:opacity-75"
      >
        {content}
      </Pressable>

      {canPreview && resolvedUri ? (
        <AvatarPhotoPreview
          visible={previewOpen}
          uri={resolvedUri}
          name={name}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}

function initials(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return "S";

  const result: string[] = [];
  let isAtWordStart = true;

  for (const character of normalized) {
    const isWhitespace =
      character === " " ||
      character === "\t" ||
      character === "\n" ||
      character === "\r";

    if (isWhitespace) {
      isAtWordStart = true;
    } else if (isAtWordStart) {
      result.push(character);
      isAtWordStart = false;
      if (result.length === 2) break;
    }
  }

  return result.join("").toLocaleUpperCase("tr-TR") || "S";
}
