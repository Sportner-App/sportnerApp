import { Linking, Platform } from "react-native";

export type DirectionsApp = "apple" | "google" | "yandex";

export type DirectionsTarget = {
  latitude: number;
  longitude: number;
  label: string;
};

/**
 * Seçilen harita uygulamasında yol tarifini açar.
 * HTTPS / universal link kullanır; uygulama yüklüyse ona düşer.
 */
export async function openDirections(
  app: DirectionsApp,
  target: DirectionsTarget,
) {
  const { latitude, longitude, label } = target;
  const encoded = encodeURIComponent(label);

  const urls: Record<DirectionsApp, string> = {
    apple: `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encoded}`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`,
    yandex: `https://yandex.com.tr/maps/?rtext=~${latitude},${longitude}&rtt=auto`,
  };

  const url = urls[app];

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    // Android'de Apple Maps yoksa Google web'e düş
    if (app === "apple" && Platform.OS === "android") {
      await Linking.openURL(urls.google);
      return;
    }

    await Linking.openURL(url);
  } catch {
    await Linking.openURL(urls.google);
  }
}
