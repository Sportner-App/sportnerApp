import { Linking, Pressable, View } from "react-native";

import { themeColors } from "@/constants/theme";
import { AppText as Text } from "@/components/app-text";

const MAPBOX_URL = "https://www.mapbox.com/about/maps";
const OSM_URL = "https://www.openstreetmap.org/copyright";

/**
 * Statik harita görsellerinin atfı. Görselde `logo=false&attribution=false`
 * kullandığımız için atıf arayüzde gösterilmek zorunda — Mapbox statik
 * haritalar için metin atfını kabul ediyor, ama kaldırılamaz.
 * Bkz. services/mapbox.ts > staticMapUrl
 */
export function MapAttribution() {
  return (
    <View className="absolute bottom-1 right-1.5 flex-row items-center gap-1 rounded-md bg-background-primary/70 px-1.5 py-0.5">
      <Pressable hitSlop={6} onPress={() => void Linking.openURL(MAPBOX_URL)}>
        <Text
          className="font-body"
          style={{ fontSize: 9, color: themeColors.text.tertiary }}
        >
          © Mapbox
        </Text>
      </Pressable>
      <Pressable hitSlop={6} onPress={() => void Linking.openURL(OSM_URL)}>
        <Text
          className="font-body"
          style={{ fontSize: 9, color: themeColors.text.tertiary }}
        >
          © OpenStreetMap
        </Text>
      </Pressable>
    </View>
  );
}
