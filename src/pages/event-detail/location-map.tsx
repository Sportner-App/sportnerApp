import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  DirectionsSheet,
  MapAttribution,
  MapPin,
  MapUnavailable,
} from "@/components";
import { themeColors, typeStyles } from "@/constants/theme";
import { staticMapUrl, zoomForLongitudeSpan } from "@/services/mapbox";
import type { EventDetail } from "@/types/events";
import type { DirectionsTarget } from "@/utils/open-directions";
import { lightImpact } from "@/utils/haptics";
import { noLocationLabel } from "@/utils/events";
import { AppText as Text } from "@/components/app-text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Önceki MapView'ın latitudeDelta'sı; aynı yakınlığı koruyoruz. */
const MAP_SPAN_DEGREES = 0.018;

type LocationMapProps = {
  event: EventDetail;
};

function locationPresentation(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { title: noLocationLabel(), detail: undefined };
  }

  return {
    title: parts[0],
    detail: parts.length > 1 ? parts.slice(1).join(", ") : undefined,
  };
}

export function LocationMap({ event }: LocationMapProps) {
  const { t } = useTranslation("eventDetail");
  const { t: tLocation } = useTranslation("location");
  const [sheetVisible, setSheetVisible] = useState(false);
  // Statik görselin ölçüsü kabın gerçek genişliğinden türetiliyor; ekran
  // genişliği eksi padding'i tahmin etmeye çalışmıyoruz.
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const handleMapLayout = (layoutEvent: LayoutChangeEvent) => {
    const { width, height } = layoutEvent.nativeEvent.layout;

    if (width > 0 && height > 0 && width !== size?.width) {
      setSize({ width, height });
    }
  };

  const mapImageUrl = size
    ? staticMapUrl({
        latitude: event.latitude,
        longitude: event.longitude,
        width: size.width,
        height: size.height,
        zoom: zoomForLongitudeSpan(MAP_SPAN_DEGREES, size.width),
      })
    : null;

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
            {t("location.heading")}
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
              className="font-body text-caption"
              style={{ color: themeColors.text.primary }}
            >
              {t("location.directions")}
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
          <View className="relative h-52" onLayout={handleMapLayout}>
            {mapImageUrl ? (
              <>
                <Image
                  source={{ uri: mapImageUrl }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                {/* Görsel etkinlik koordinatında ortalı: kap yüksekliğin üst
                    yarısını kaplayıp pin'i dibe hizalayınca pin'in ucu tam
                    merkeze, yani koordinatın üstüne oturuyor. */}
                <View
                  pointerEvents="none"
                  className="absolute inset-x-0 top-0 items-center justify-end"
                  style={{ bottom: "50%" }}
                >
                  <MapPin />
                </View>
              </>
            ) : (
              <MapUnavailable message={tLocation("mapUnavailable")} />
            )}

            <Pressable onPress={openSheet} className="absolute inset-0" />

            {/* Tam kaplayan Pressable'dan sonra: atıf dokunulabilir kalmalı. */}
            {mapImageUrl ? <MapAttribution /> : null}
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
                className="font-body-bold text-body-sm"
                style={{ color: themeColors.text.primary }}
                numberOfLines={1}
              >
                {primaryLocation}
              </Text>
              {secondaryAddress ? (
                <Text
                  className="mt-0.5 font-body text-caption leading-4"
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
