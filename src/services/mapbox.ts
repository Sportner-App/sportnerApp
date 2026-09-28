import Mapbox from "@rnmapbox/maps";

import { MAPBOX_STYLE_URL } from "@/constants/map";

/**
 * Mapbox public access token (pk.*). Harita render'ı bunu kullanır; adres
 * arama hâlâ Google Places üzerinden gidiyor (bkz. location-service.ts).
 */
function getAccessToken() {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
}

export function hasMapboxToken() {
  return getAccessToken().length > 0;
}

let configured = false;

/**
 * Uygulama açılışında bir kez çağrılır (app/_layout.tsx). Token yoksa harita
 * bileşenleri sessizce boş kalmasın diye uyarı basar; crash etmez.
 */
export function configureMapbox() {
  if (configured) {
    return;
  }

  const token = getAccessToken();

  if (!token) {
    console.warn(
      "[mapbox] EXPO_PUBLIC_MAPBOX_TOKEN tanımlı değil, harita boş render edilecek.",
    );
    return;
  }

  Mapbox.setAccessToken(token);
  // Kullanıcı konumu/kullanım verisi Mapbox'a gönderilmesin.
  Mapbox.setTelemetryEnabled(false);
  configured = true;
}

// --- Static Images API -----------------------------------------------------

const STATIC_IMAGE_BASE = "https://api.mapbox.com/styles/v1";

/** Mapbox tek istekte en fazla 1280x1280 döndürüyor. */
const STATIC_MAX_SIZE = 1280;

/** "mapbox://styles/<user>/<id>" → "<user>/<id>" */
function styleOwnerAndId(styleUrl: string) {
  return styleUrl.replace(/^mapbox:\/\/styles\//, "");
}

/**
 * Verilen boylam açıklığını (derece) bir piksel genişliğinde gösteren zoom.
 * Mapbox tile'ları 512px olduğu için: 360 * width / (512 * 2^z) = span
 */
export function zoomForLongitudeSpan(span: number, widthPx: number) {
  return Math.log2((360 * widthPx) / (512 * span));
}

type StaticMapOptions = {
  latitude: number;
  longitude: number;
  /** Ölçülen kap genişliği/yüksekliği (dp). */
  width: number;
  height: number;
  zoom: number;
};

/**
 * Etkinlik detayındaki harita etkileşimsiz (scroll/zoom kapalı, pointerEvents
 * none) olduğu için canlı SDK yerine hazır PNG kullanıyoruz: MAU harcamıyor,
 * ayrı kotadan (50k istek/ay ücretsiz) düşüyor ve sayfa daha hızlı açılıyor.
 *
 * Gömülü logo/atıf kapatıldı: 208pt'lik kartta wordmark görselin yarısı kadar
 * yer kaplıyordu. Mapbox statik haritalar için metin atfını açıkça kabul
 * ediyor ("attributed in the same fashion as you would cite a photograph: in
 * a textual description near the image") — karşılığı görselin sağ altındaki
 * MapAttribution bileşeni. O bileşen kaldırılırsa bu parametreler de geri
 * alınmalı, yoksa kullanım şartları ihlal edilir.
 *
 * Marker eklemiyoruz: görsel etkinlik koordinatında ortalandığı için marka
 * pin'i (components/map-pin) tam merkeze overlay olarak biniyor.
 */
export function staticMapUrl({
  latitude,
  longitude,
  width,
  height,
  zoom,
}: StaticMapOptions): string | null {
  const token = getAccessToken();

  if (!token || width <= 0 || height <= 0) {
    return null;
  }

  const w = Math.min(Math.round(width), STATIC_MAX_SIZE);
  const h = Math.min(Math.round(height), STATIC_MAX_SIZE);
  const style = styleOwnerAndId(MAPBOX_STYLE_URL);
  const center = `${longitude.toFixed(6)},${latitude.toFixed(6)},${zoom.toFixed(2)},0`;

  return `${STATIC_IMAGE_BASE}/${style}/static/${center}/${w}x${h}@2x?logo=false&attribution=false&access_token=${token}`;
}
