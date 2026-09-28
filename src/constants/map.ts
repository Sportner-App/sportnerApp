import { DEFAULT_EVENT_LOCATION } from "@/constants/events";

/** Studio'da üretilen Sportner koyu teması (tools/mapbox-restyle.js çıktısı). */
export const MAPBOX_STYLE_URL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim() ||
  "mapbox://styles/yagizerdenler/cmukqizlx000601s5bonw7aio";

/**
 * Mapbox koordinatları [longitude, latitude] sırasında — react-native-maps'in
 * tersi. Dönüşümü tek yerde tutuyoruz ki ekranlarda sıra hatası olmasın.
 */
export function toMapboxCoord(point: {
  latitude: number;
  longitude: number;
}): [number, number] {
  return [point.longitude, point.latitude];
}

/**
 * Varsayılan şehir görünümü. 0.04° boylam açıklığı ~390pt genişlikte
 * 360 * 390 / (512 * 2^z) = 0.04 → z ≈ 12.7 veriyor.
 */
export const MAP_INITIAL_CAMERA = {
  centerCoordinate: toMapboxCoord(DEFAULT_EVENT_LOCATION),
  zoomLevel: 12.7,
} as const;
