import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DirectionsSheet, MapPin } from "@/components";
import { DARK_MAP_STYLE } from "@/constants/map";
import { themeColors, typeStyles } from "@/constants/theme";
import { isGooglePlacesEnabled } from "@/services/location-service";
import type { EventDetail } from "@/types/events";
import type { DirectionsTarget } from "@/utils/open-directions";
import { lightImpact } from "@/utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type LocationMapProps = {
  event: EventDetail;
};

function locationPresentation(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { title: "Konum yok", detail: undefined };
  }

  return {
    title: parts[0],
    detail: parts.length > 1 ? parts.slice(1).join(", ") : undefined,
  };
}

export function LocationMap({ event }: LocationMapProps) {
  const useGoogleMaps = isGooglePlacesEnabled();
  const [sheetVisible, setSheetVisible] = useState(false);
  const { title: primaryLocation, detail: secondaryAddress } =
    locationPresentation(event.address);

  const target: DirectionsTarget = {
    latitude: event.latitude,
    longitude: event.longitude,
    label: event.address,
  };

  const openSheet = () => setSheetVisible(true);
  const directionsScale = useSharedValue(1);
  const directionsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: directionsScale.value }],
  }));

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(500).delay(280)}
        className="gap-3"
      >
        <View className="flex-row items-center justify-between">
          <Text
            style={[typeStyles.label, { color: themeColors.text.secondary }]}
          >
            Konum
          </Text>
          <AnimatedPressable
            hitSlop={8}
            onPress={() => {
              lightImpact();
              openSheet();
            }}
            onPressIn={() => {
              directionsScale.value = withTiming(0.97, { duration: 90 });
            }}
            onPressOut={() => {
              directionsScale.value = withTiming(1, { duration: 90 });
            }}
            style={directionsStyle}
            className="flex-row items-center gap-1.5"
          >
            <Text
              className="font-body text-xs"
              style={{ color: themeColors.text.primary }}
            >
              Yol tarifi
            </Text>
            <FontAwesome6
              name="diamond-turn-right"
              size={11}
              color={themeColors.text.primary}
            />
          </AnimatedPressable>
        </View>

        <View
          className="overflow-hidden rounded-xlarge"
          style={{
            borderWidth: 1,
            borderColor: themeColors.border.default,
            backgroundColor: themeColors.surface.primary,
          }}
        >
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

          <View
            className="flex-row items-start gap-3 px-4 py-3.5"
            style={{
              borderTopWidth: 1,
              borderTopColor: themeColors.border.default,
            }}
          >
            <View
              className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: themeColors.surface.secondary }}
            >
              <FontAwesome6
                name="location-dot"
                size={12}
                color={themeColors.text.secondary}
              />
            </View>
            <View className="flex-1">
              <Text
                className="font-body text-sm font-semibold"
                style={{ color: themeColors.text.primary }}
                numberOfLines={1}
              >
                {primaryLocation}
              </Text>
              {secondaryAddress ? (
                <Text
                  className="mt-0.5 font-body text-xs leading-4"
                  style={{ color: themeColors.text.secondary }}
                  numberOfLines={2}
                >
                  {secondaryAddress}
                </Text>
              ) : null}
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
