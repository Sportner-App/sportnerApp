import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppText as Text, Avatar } from "@/components";
import {
  FALLBACK_SPORT_IMAGE,
  resolveEventPhoto,
} from "@/features/sports/sport-images";
import type { IconName } from "@/types/components";
import type { ParticipantAvatarPreview } from "@/features/events/types";
import { themeColors } from "@/constants/theme";

// Fotoğraf üzerindeki içerik her iki temada da koyu overlay üzerinde okunur.
export const MIST = themeColors.background.primary;

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
      <FontAwesome6
        name={icon}
        size={12}
        color={accent ?? themeColors.icon.soft}
      />
      <Text
        numberOfLines={1}
        className="max-w-[200px] font-body-bold text-label text-white"
      >
        {label}
      </Text>
    </View>
  );
}

// Beyaz + alfa maske; `tools/generate-event-mist.js` üretir.
const MIST_MASK = require("../../../../assets/images/event-card-mist.png");

/**
 * Fotoğrafın üstündeki sis. Önceden react-native-svg ile 4 gradyan katmanı
 * olarak çiziliyordu; iOS'ta SVG ana thread'de CPU ile çizildiği için ekrana
 * aynı anda birkaç kart girince (ör. boş sekmeden dolu sekmeye geçiş) ana
 * thread tıkanıyordu. Aynı gradyanlar artık hazır bir maske: bir kez
 * çözülüp önbellekte kalıyor, GPU'da birleştiriliyor. Gradyanlar kartın
 * kutusuna göre tanımlı olduğundan esnetince görünüm aynı.
 */
export function MistOverlay() {
  return (
    <Image
      source={MIST_MASK}
      resizeMode="stretch"
      tintColor={MIST}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function SportPhoto({
  image,
}: {
  image: ReturnType<typeof resolveEventPhoto>;
}) {
  // Sanal listede kart görünümü başka bir etkinlik için yeniden
  // kullanılıyor; "yüklenemedi" durumu görsele bağlı tutuluyor ki önceki
  // etkinliğin hatası yenisine taşınmasın.
  const imageKey =
    typeof image === "object" && image && "uri" in image
      ? String(image.uri)
      : String(image);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const failed = failedKey === imageKey;

  return (
    <Image
      source={failed ? FALLBACK_SPORT_IMAGE : image}
      resizeMode="cover"
      onError={() => setFailedKey(imageKey)}
      style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
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
