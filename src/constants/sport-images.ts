import type { ImageSourcePropType } from "react-native";

export const FALLBACK_SPORT_IMAGE: ImageSourcePropType = require("../../assets/images/sports/fallback.png");

/**
 * Etkinlik/spor fotoğrafı: backend'in yüklediği kapak görseli varsa onu,
 * yoksa genel fallback görselini kullanır.
 */
export function resolveEventPhoto(
  coverImageUrl?: string | null,
): ImageSourcePropType {
  if (coverImageUrl) {
    return { uri: coverImageUrl };
  }

  return FALLBACK_SPORT_IMAGE;
}
