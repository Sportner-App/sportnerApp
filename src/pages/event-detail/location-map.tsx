import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, { FadeInDown } from "react-native-reanimated";

import { DirectionsSheet, MapPin } from "@/components";
import { DARK_MAP_STYLE } from "@/constants/map";
import { isGooglePlacesEnabled } from "@/services/location-service";
import type { EventDetail } from "@/types/events";
import type { DirectionsTarget } from "@/utils/open-directions";

type LocationMapProps = {
  event: EventDetail;
};

export function LocationMap({ event }: LocationMapProps) {
  const useGoogleMaps = isGooglePlacesEnabled();
  const [sheetVisible, setSheetVisible] = useState(false);

  const target: DirectionsTarget = {
    latitude: event.latitude,
    longitude: event.longitude,
    label: event.address,
  };

  const openSheet = () => setSheetVisible(true);

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(500).delay(280)}
        className="gap-3"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-base text-white">Konum</Text>
          <Pressable
            hitSlop={8}
            onPress={openSheet}
            className="flex-row items-center gap-1.5 active:opacity-70"
          >
            <Text className="font-body text-xs text-brand-primary">
              Yol tarifi
            </Text>
            <FontAwesome6
              name="diamond-turn-right"
              size={11}
              color="#ccff00"
            />
          </Pressable>
        </View>

        <View className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90">
          <View className="relative h-52">
            <MapView
              style={{ flex: 1 }}
              provider={useGoogleMaps ? PROVIDER_GOOGLE : undefined}
              customMapStyle={useGoogleMaps ? DARK_MAP_STYLE : undefined}
              userInterfaceStyle="dark"
              initialRegion={{
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.018,
                longitudeDelta: 0.018,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsCompass={false}
              showsPointsOfInterest={false}
              pointerEvents="none"
            >
              <Marker
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <MapPin />
              </Marker>
            </MapView>

            <Pressable onPress={openSheet} className="absolute inset-0" />
          </View>

          <View className="flex-row items-start gap-3 border-t border-white/10 px-4 py-3.5">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15">
              <FontAwesome6 name="location-dot" size={12} color="#ccff00" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-white">
                {event.location}
              </Text>
              <Text
                className="mt-0.5 font-body text-xs leading-4 text-brand-neutral"
                numberOfLines={2}
              >
                {event.address}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <DirectionsSheet
        visible={sheetVisible}
        target={target}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}
