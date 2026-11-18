import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { AppText as Text } from "@/components";
import { themeColors } from "@/constants/theme";
import { getCurrentLocale } from "@/i18n";
import { resolveMediaUrl } from "@/utils/media-url";

export type ClubGridBadge = {
  kind: "member" | "private" | "pending";
  label: string;
};

/** Kulüp ızgarası için dikey kart (2 sütun). */
export function ClubGridCard({
  id,
  name,
  imageUrl,
  subtitle,
  badge,
}: {
  id: string;
  name: string;
  imageUrl?: string | null;
  subtitle: string;
  badge?: ClubGridBadge;
}) {
  const router = useRouter();
  // Hata durumu URI'ye bağlı: listede yeniden kullanılan kart önceki
  // kulübün "yüklenemedi" durumunu taşımasın.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const resolvedUri = imageUrl ? resolveMediaUrl(imageUrl) : null;
  const hasPhoto = Boolean(resolvedUri && failedUri !== resolvedUri);
  const initial = name.trim().charAt(0).toLocaleUpperCase(getCurrentLocale());

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/clubs/${id}`)}
      className="w-[48%] overflow-hidden rounded-2xl bg-surface-primary active:opacity-80"
    >
      <View
        className="w-full items-center justify-center bg-surface-secondary"
        style={{ aspectRatio: 4 / 3 }}
      >
        {hasPhoto && resolvedUri ? (
          <Image
            source={{ uri: resolvedUri }}
            resizeMode="cover"
            onError={() => setFailedUri(resolvedUri)}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Text className="font-display text-heading-lg text-brand-primary">
            {initial || "K"}
          </Text>
        )}
      </View>
      <View className="px-3 pb-2.5 pt-2">
        <Text
          numberOfLines={2}
          className="text-left font-body-bold text-label text-text-primary"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 text-left font-body text-caption text-text-tertiary"
        >
          {subtitle}
        </Text>
        {badge ? (
          <View className="mt-1 flex-row items-center gap-1">
            {badge.kind === "private" ? (
              <FontAwesome6
                name="lock"
                size={9}
                color={themeColors.text.tertiary}
              />
            ) : null}
            <Text
              className={`font-body-bold text-caption ${
                badge.kind === "member"
                  ? "text-brand-primary"
                  : badge.kind === "pending"
                    ? "text-amber-300"
                    : "text-text-tertiary"
              }`}
            >
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
