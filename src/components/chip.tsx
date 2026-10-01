import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";

import { sportAccentToken, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

type ChipProps = {
  label: string;
  /** `sport`: branş kimliği (aksan noktası). `neutral`: tarih vb. bilgi. */
  variant?: "sport" | "neutral";
  /** `sport` varyantında aksan rengini çözmek için katalog slug'ı. */
  sport?: string | null;
  icon?: IconName;
  className?: string;
};

/**
 * Bilgi etiketi (spor, tarih). Tek görsel dil: küçük köşe, cümle düzeni,
 * harf aralığı yok. Seviye/ücret/durum gibi ikincil bilgiler chip değil,
 * düz metin olarak gösterilir.
 */
export function Chip({
  label,
  variant = "neutral",
  sport,
  icon,
  className,
}: ChipProps) {
  const accent = variant === "sport" ? sportAccentToken(sport) : null;
  const markColor = accent?.accent ?? themeColors.text.secondary;

  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-small px-2 py-1 ${className ?? ""}`}
      style={{
        backgroundColor: accent?.soft ?? themeColors.surface.secondary,
      }}
    >
      {icon ? (
        <FontAwesome6 name={icon} size={10} color={markColor} />
      ) : variant === "sport" ? (
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: markColor }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className="font-body-bold text-caption text-text-primary"
      >
        {label}
      </Text>
    </View>
  );
}
