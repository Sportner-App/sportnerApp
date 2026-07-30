/**
 * Location picker component for create event
 */

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import {
  reverseGeocodeCoordinate,
  type NominatimResult,
} from "@/features/events-create";
import { useToast } from "@/shared/ui/toast-provider";
import { INITIAL_REGION } from "../model/create-event-constants";
import { useLocationSearch } from "../model/use-location-search";

interface LocationPickerProps {
  searchQuery: string;
  addressText: string;
  marker: { latitude: number; longitude: number } | null;
  mapRegion: typeof INITIAL_REGION;
  isResolvingAddress: boolean;
  onSearchChange: (text: string) => void;
  onAddressChange: (text: string) => void;
  onMarkerChange: (
    coords: { latitude: number; longitude: number } | null,
  ) => void;
  onRegionChange: (region: typeof INITIAL_REGION) => void;
}

export function LocationPicker({
  searchQuery,
  addressText,
  marker,
  mapRegion,
  isResolvingAddress,
  onSearchChange,
  onAddressChange,
  onMarkerChange,
  onRegionChange,
}: LocationPickerProps) {
  const { showToast } = useToast();
  const { suggestions, isSearching } = useLocationSearch(searchQuery);

  const handleSuggestionSelect = (item: NominatimResult) => {
    const latitude = Number.parseFloat(item.lat);
    const longitude = Number.parseFloat(item.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    onMarkerChange({ latitude, longitude });
    onRegionChange({
      latitude,
      longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
    onAddressChange(item.display_name);
    onSearchChange(item.display_name);
  };

  const handleMapPress = async (latitude: number, longitude: number) => {
    onMarkerChange({ latitude, longitude });
    onRegionChange({
      ...mapRegion,
      latitude,
      longitude,
    });

    try {
      const resolvedAddress = await reverseGeocodeCoordinate({
        latitude,
        longitude,
      });

      if (resolvedAddress) {
        onAddressChange(resolvedAddress);
        onSearchChange(resolvedAddress);
      }
    } catch {
      showToast({
        type: "error",
        title: "Adres bulunamadı",
        description: "Lütfen adresi manuel gir.",
      });
    }
  };

  return (
    <View>
      <TextInput
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Konum ara (örn: Caddebostan)"
        placeholderTextColor="#64748b"
        className="min-h-[54px] rounded-2xl border border-brand-tertiary bg-brand-raised px-4 font-body text-base text-white"
      />

      {!!isSearching && (
        <Text className="mt-2 font-body text-xs text-brand-neutral">
          Aranıyor...
        </Text>
      )}

      {suggestions.length > 0 && (
        <View className="mt-2 max-h-48 rounded-2xl border border-brand-tertiary bg-brand-raised p-2">
          {suggestions.map((item) => (
            <Pressable
              key={item.place_id}
              onPress={() => handleSuggestionSelect(item)}
              className="rounded-xl px-3 py-2"
            >
              <Text className="font-body text-xs leading-5 text-brand-neutral">
                {item.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="mt-4 h-60 overflow-hidden rounded-2xl border border-brand-tertiary">
        <MapView
          style={{ flex: 1 }}
          initialRegion={INITIAL_REGION}
          region={mapRegion}
          onRegionChangeComplete={onRegionChange}
          onPress={(event) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            void handleMapPress(latitude, longitude);
          }}
        >
          {marker && <Marker coordinate={marker} title="Etkinlik Konumu" />}
        </MapView>
      </View>

      <View className="mt-3 flex-row items-center">
        <FontAwesome6 name="map-pin" size={16} color="#ccff00" />
        <Text className="ml-2 flex-1 font-body text-xs text-brand-neutral">
          {isResolvingAddress
            ? "Konum adresi alınıyor..."
            : "Haritaya dokunarak pin bırakabilir veya arama ile seçebilirsin."}
        </Text>
      </View>

      <TextInput
        value={addressText}
        onChangeText={onAddressChange}
        placeholder="Adres bilgisi"
        placeholderTextColor="#64748b"
        className="mt-3 min-h-[54px] rounded-2xl border border-brand-tertiary bg-brand-raised px-4 font-body text-base text-white"
      />
    </View>
  );
}
