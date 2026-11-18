import { useState } from "react";
import { Image, View } from "react-native";

import { AppText as Text } from "@/components";
import { getCurrentLocale } from "@/i18n";
import { resolveMediaUrl } from "@/utils/media-url";

/**
 * Kulüp görseli; yoksa (ya da yüklenemezse) baş harf. Kare-yuvarlak köşe
 * (Avatar yuvarlak). Hata durumu URI'ye bağlı: sanal listede yeniden
 * kullanılan kartta önceki kulübün "yüklenemedi" durumu taşınmasın.
 */
export function OrganizationImage({
  uri,
  name,
  size,
  radius,
  textClassName = "text-heading-sm",
}: {
  uri?: string | null;
  name: string;
  size: number;
  radius: number;
  textClassName?: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const resolvedUri = uri ? resolveMediaUrl(uri) : null;
  const hasPhoto = Boolean(resolvedUri && failedUri !== resolvedUri);
  const initial = name.trim().charAt(0).toLocaleUpperCase(getCurrentLocale());

  return (
    <View
      className="items-center justify-center overflow-hidden border border-brand-primary/30 bg-brand-primary/10"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {hasPhoto && resolvedUri ? (
        <Image
          source={{ uri: resolvedUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailedUri(resolvedUri)}
        />
      ) : (
        <Text className={`font-display text-brand-primary ${textClassName}`}>
          {initial || "K"}
        </Text>
      )}
    </View>
  );
}
