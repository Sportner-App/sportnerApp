import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MapPressEvent,
  type Region,
} from "react-native-maps";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

import { MapPin } from "@/components";
import { DARK_MAP_STYLE, MAP_INITIAL_REGION } from "@/constants/map";
import { useLocationSearch } from "@/hooks/use-location-search";
import { isGooglePlacesEnabled } from "@/services/location-service";
import type {
  LocationSuggestion,
  SelectedLocation,
} from "@/types/location";

type LocationPickerProps = {
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  onSelect: (location: SelectedLocation) => void;
};

export function LocationPicker({
  addressText,
  latitude,
  longitude,
  onSelect,
}: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
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

  const useGoogleMaps = isGooglePlacesEnabled();
  const hasSelection = latitude != null && longitude != null;

  const animateTo = (lat: number, lng: number) => {
    const region: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    mapRef.current?.animateToRegion(region, 380);
  };

  const handleSuggestionPress = async (suggestion: LocationSuggestion) => {
    const resolved = await resolveSuggestion(suggestion);

    if (!resolved) {
      return;
    }

    onSelect(resolved);
    animateTo(resolved.latitude, resolved.longitude);
  };

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
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
      <Text className="font-body text-sm text-brand-neutral">Konum</Text>

      <View className="overflow-hidden rounded-[28px] border border-white/10 bg-brand-surface/90">
        {/* Arama */}
        <View className="z-20 border-b border-white/10 px-3 py-3">
          <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-secondary/80 px-3.5 py-3">
            <FontAwesome6 name="magnifying-glass" size={14} color="#ccff00" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Konum ara veya haritadan seç"
              placeholderTextColor="#64748b"
              className="flex-1 font-body text-base text-white"
              autoCorrect={false}
              returnKeyType="search"
            />
            {isSearching || isResolving ? (
              <ActivityIndicator size="small" color="#ccff00" />
            ) : query.length > 0 ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setQuery("");
                  clearSuggestions();
                }}
              >
                <FontAwesome6 name="xmark" size={14} color="#64748b" />
              </Pressable>
            ) : null}
          </View>

          {suggestions.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-brand-raised"
            >
              {suggestions.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSuggestionPress(item)}
                  className={`flex-row items-start gap-3 px-3.5 py-3 active:bg-white/5 ${
                    index < suggestions.length - 1
                      ? "border-b border-white/5"
                      : ""
                  }`}
                >
                  <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15">
                    <FontAwesome6
                      name="location-dot"
                      size={12}
                      color="#ccff00"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-body text-sm font-semibold text-white"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="mt-0.5 font-body text-xs text-brand-neutral"
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
        <View className="relative h-56">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={useGoogleMaps ? PROVIDER_GOOGLE : undefined}
            initialRegion={MAP_INITIAL_REGION}
            customMapStyle={useGoogleMaps ? DARK_MAP_STYLE : undefined}
            userInterfaceStyle="dark"
            onPress={handleMapPress}
            showsUserLocation={false}
            showsCompass={false}
            showsPointsOfInterest={false}
            toolbarEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {hasSelection && (
              <Marker
                coordinate={{
                  latitude: latitude!,
                  longitude: longitude!,
                }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <MapPin />
              </Marker>
            )}
          </MapView>

          {/* Alt bilgi şeridi */}
          <View className="absolute bottom-3 left-3 right-3">
            <View className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-brand-secondary/90 px-3 py-2.5">
              <FontAwesome6
                name={hasSelection ? "check" : "hand-pointer"}
                size={12}
                color="#ccff00"
              />
              <Text
                className="flex-1 font-body text-xs text-brand-neutral"
                numberOfLines={2}
              >
                {hasSelection
                  ? addressText
                  : "Haritaya dokun veya yukarıdan ara"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
