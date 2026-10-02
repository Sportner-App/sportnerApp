import Mapbox from "@rnmapbox/maps";

import { MAP_INITIAL_CAMERA, toMapboxCoord } from "@/constants/map";

export type Coordinate = { latitude: number; longitude: number };

/**
 * Kamerayı etkinliklerin üstüne oturtan sınırlar. Eski region hesabındaki
 * `delta * 1.6` payı yerine Mapbox'ın kendi padding'ini kullanıyoruz: üstteki
 * filtre şeridi ve alttaki önizleme kartı gerçek piksel değerleriyle hesaba
 * katıldığı için pinler artık arayüzün altında kalmıyor.
 */
export const BOUNDS_PADDING = {
  paddingTop: 96,
  paddingBottom: 160,
  paddingLeft: 48,
  paddingRight: 48,
};

export function boundsForPoints(points: Coordinate[]) {
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  return {
    ne: [maxLng, maxLat] as [number, number],
    sw: [minLng, minLat] as [number, number],
    ...BOUNDS_PADDING,
  };
}

/** Tek nokta / boş liste sınır hesabına uygun değil; merkez + zoom'a düşer. */
export function cameraForPoints(points: Coordinate[], singleZoom: number) {
  if (points.length === 0) {
    return {
      centerCoordinate: [...MAP_INITIAL_CAMERA.centerCoordinate],
      zoomLevel: MAP_INITIAL_CAMERA.zoomLevel,
    };
  }

  if (points.length === 1) {
    return {
      centerCoordinate: toMapboxCoord(points[0]),
      zoomLevel: singleZoom,
    };
  }

  return { bounds: boundsForPoints(points) };
}
