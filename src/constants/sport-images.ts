import type { ImageSourcePropType } from "react-native";

import { sportKeyForSlug, type SportAccentName } from "./theme";

const SPORT_IMAGE_BY_KEY = {
  basketball: require("../../assets/images/sports/basketball.png"),
  football: require("../../assets/images/sports/football.png"),
  volleyball: require("../../assets/images/sports/volleyball.png"),
  running: require("../../assets/images/sports/running.png"),
} as const satisfies Partial<Record<SportAccentName, ImageSourcePropType>>;

export const SPORT_IMAGES = SPORT_IMAGE_BY_KEY;

export type SportImageKey = keyof typeof SPORT_IMAGE_BY_KEY;

export function sportImageForSlug(
  slug: string | null | undefined,
): ImageSourcePropType | null {
  const key = sportKeyForSlug(slug);

  if (!key || !(key in SPORT_IMAGE_BY_KEY)) {
    return null;
  }

  return SPORT_IMAGE_BY_KEY[key as SportImageKey];
}
