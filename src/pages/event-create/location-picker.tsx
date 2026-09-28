import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Mapbox from "@rnmapbox/maps";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { MapPin, MapUnavailable } from "@/components";
import {
  MAP_INITIAL_CAMERA,
  MAPBOX_STYLE_URL,
  toMapboxCoord,
} from "@/constants/map";
import { themeColors } from "@/constants/theme";
import { useLocationSearch } from "@/hooks/use-location-search";
import { hasMapboxToken, zoomForLongitudeSpan } from "@/services/mapbox";
import type { LocationSuggestion, SelectedLocation } from "@/types/location";
import { AppText as Text } from "@/components/app-text";

type LocationPickerProps = {
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  onSelect: (location: SelectedLocation) => void;
  compact?: boolean;
  expanded?: boolean;
};

export function LocationPicker({
  addressText,
  latitude,
  longitude,
  onSelect,
  compact = false,
  expanded = false,
}: LocationPickerProps) {
  const { t } = useTranslation("eventCreate");
  const { t: tLocation } = useTranslation("location");
  const cameraRef = useRef<Mapbox.Camera>(null);
  const { width: screenWidth } = useWindowDimensions();
  const {
    query,
    setQuery,
    suggestions,
    isSearching,
    isResolving,
    resolveSuggestion,
    resolvePoint,
    clearSuggestions,
  } = useLocationSearch(addressText);

  const mapAvailable = hasMapboxToken();
  const hasSelection = latitude != null && longitude != null;

  // Eski MapView'ın latitudeDelta 0.02'si; yakınlık birebir korunsun diye
  // sabit yazmak yerine ekran genişliğinden türetiliyor.
  const selectionZoom = zoomForLongitudeSpan(0.02, screenWidth);

  const animateTo = (lat: number, lng: number) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: selectionZoom,
      animationDuration: 380,
    });
  };

  /**
   * Düzenlemede harita seçili konumda açılsın. defaultSettings yalnızca mount
   * anında okunduğu için koordinat sonradan gelirse (etkinlik verisi async)
   * aşağıdaki effect devreye giriyor.
   */
  const initialCamera = hasSelection
    ? {
        centerCoordinate: toMapboxCoord({
          latitude: latitude!,
          longitude: longitude!,
        }),
        zoomLevel: selectionZoom,
      }
    : {
        centerCoordinate: [...MAP_INITIAL_CAMERA.centerCoordinate],
        zoomLevel: MAP_INITIAL_CAMERA.zoomLevel,
      };

  const didFocusSelection = useRef(false);

  useEffect(() => {
    if (didFocusSelection.current || !hasSelection) {
      return;
    }

    didFocusSelection.current = true;
    animateTo(latitude!, longitude!);
    // animateTo kasıtlı olarak bağımlılıkta değil: her render'da yeniden
    // oluşuyor ve effect'i gereksiz tetiklerdi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelection, latitude, longitude]);

  const handleSuggestionPress = async (suggestion: LocationSuggestion) => {
    const resolved = await resolveSuggestion(suggestion);

    if (!resolved) {
      return;
    }

    onSelect(resolved);
    animateTo(resolved.latitude, resolved.longitude);
  };

  /** Mapbox tıklamayı GeoJSON feature olarak veriyor: [longitude, latitude]. */
  const handleMapPress = async (feature: GeoJSON.Feature) => {
    if (feature.geometry?.type !== "Point") {
      return;
    }

    const [lng, lat] = feature.geometry.coordinates;
    animateTo(lat, lng);

    const resolved = await resolvePoint(lat, lng);

    if (resolved) {
      onSelect(resolved);
      return;
    }

    onSelect({
      addressText: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(140)}
      className="z-10 gap-2"
    >
      <Text className="font-body-bold text-label text-text-secondary">
        {t("location.label")}
      </Text>

      <View className="overflow-hidden rounded-[28px] border border-border-default bg-surface-primary">
        {/* Arama */}
        <View className="z-20 border-b border-border-default px-3 py-3">
          <View className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-secondary px-3.5 py-3">
            <FontAwesome6
              name="magnifying-glass"
              size={14}
              color={themeColors.brand.primary}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("location.searchPlaceholder")}
              placeholderTextColor={themeColors.text.tertiary}
              className="flex-1 font-body text-body text-text-primary"
              autoCorrect={false}
              returnKeyType="search"
            />
            {isSearching || isResolving ? (
              <ActivityIndicator
                size="small"
                color={themeColors.brand.primary}
              />
            ) : query.length > 0 ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setQuery("");
                  clearSuggestions();
                }}
              >
                <FontAwesome6
                  name="xmark"
                  size={14}
                  color={themeColors.text.tertiary}
                />
              </Pressable>
            ) : null}
          </View>

          {suggestions.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              className="mt-2 overflow-hidden rounded-2xl border border-border-default bg-surface-secondary"
            >
              {suggestions.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSuggestionPress(item)}
                  className={`flex-row items-start gap-3 px-3.5 py-3 active:bg-white/5 ${
                    index < suggestions.length - 1
                      ? "border-b border-border-default"
                      : ""
                  }`}
                >
                  <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15">
                    <FontAwesome6
                      name="location-dot"
                      size={12}
                      color={themeColors.brand.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-body text-body-sm font-semibold text-text-primary"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="mt-0.5 font-body text-caption text-text-secondary"
                      numberOfLines={2}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Harita */}
        <View
          className={`relative ${expanded ? "h-[420px]" : compact ? "h-40" : "h-56"}`}
        >
          {mapAvailable ? (
            <Mapbox.MapView
              style={{ flex: 1 }}
              styleURL={MAPBOX_STYLE_URL}
              scaleBarEnabled={false}
              compassEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              logoPosition={{ bottom: 56, left: 8 }}
              attributionPosition={{ bottom: 56, left: 92 }}
              onPress={handleMapPress}
            >
              <Mapbox.Camera ref={cameraRef} defaultSettings={initialCamera} />

              {hasSelection && (
                <Mapbox.MarkerView
                  id="selected-location"
                  coordinate={toMapboxCoord({
                    latitude: latitude!,
                    longitude: longitude!,
                  })}
                  anchor={{ x: 0.5, y: 1 }}
                  allowOverlap
                >
                  <MapPin />
                </Mapbox.MarkerView>
              )}
            </Mapbox.MapView>
          ) : (
            <MapUnavailable message={tLocation("mapUnavailable")} />
          )}

          {/* Alt bilgi şeridi */}
          <View className="absolute bottom-3 left-3 right-3">
            <View className="flex-row items-center gap-2 rounded-2xl border border-white/15 bg-background-primary/90 px-3 py-2.5">
              <FontAwesome6
                name={hasSelection ? "check" : "hand-pointer"}
                size={12}
                color={themeColors.brand.primary}
              />
              <Text
                className="flex-1 font-body text-caption text-text-secondary"
                numberOfLines={2}
              >
                {hasSelection
                  ? addressText
                  : mapAvailable
                    ? t("location.emptyHint")
                    : tLocation("mapUnavailableHint")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
