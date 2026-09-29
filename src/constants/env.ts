/**
 * Ortam değişkenlerinin tek okuma noktası.
 *
 * Kodda varsayılan değer tutmuyoruz: eksik bir değişken, sessizce yanlış bir
 * ortama (ör. localhost) bağlanmaktansa açık hata versin. Yerelde `.env`,
 * EAS build'lerinde proje ortam değişkenleri doldurur.
 *
 * Metro `process.env.EXPO_PUBLIC_*` erişimlerini derleme sırasında sabit
 * değere çevirdiği için her değişken birebir yazılmak zorunda — `process.env`
 * üzerinde dinamik anahtar kullanılamaz.
 */

function required(name: string, value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(
      `${name} tanımlı değil. Yerelde .env dosyasına, EAS build'lerinde ` +
        `proje ortam değişkenlerine ekleyin.`,
    );
  }

  return trimmed;
}

function optional(value: string | undefined) {
  return value?.trim() ?? "";
}

/** API ve SignalR tabanı. Onsuz uygulama hiçbir veri çekemez. */
export const API_URL = required(
  "EXPO_PUBLIC_API_URL",
  process.env.EXPO_PUBLIC_API_URL,
);

/** Paylaşım linklerinin tabanı; ayrı bir alan adı yoksa API ile aynı. */
export const APP_LINK_BASE_URL =
  optional(process.env.EXPO_PUBLIC_APP_LINK_BASE_URL) || API_URL;

/**
 * Mapbox public token (pk.*) ve stil URL'i. Eksik olmaları uygulamayı
 * durdurmaz; harita boş render edilir (bkz. services/mapbox.ts).
 */
export const MAPBOX_TOKEN = optional(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
export const MAPBOX_STYLE_URL = optional(
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL,
);
