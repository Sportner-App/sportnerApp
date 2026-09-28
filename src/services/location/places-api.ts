import { apiClient } from "@/lib/api/client";
import { getCurrentAppLanguage } from "@/i18n";
import type { LocationSuggestion, SelectedLocation } from "@/types/location";

/**
 * Adres arama artık doğrudan sağlayıcıya değil, kendi API'mize gidiyor:
 * Google Places anahtarı sunucuda kalıyor ve sağlayıcı değişirse uygulama
 * sürümü çıkmaya gerek kalmıyor. Bkz. sportner-api > Features/Locations.
 */

type SuggestionResponse = {
  id: string;
  placeId: string;
  title: string;
  subtitle: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
};

type ResolvedPlaceResponse = {
  addressText: string;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(
  query: string,
  sessionToken: string,
): Promise<LocationSuggestion[]> {
  const response = await apiClient.get<SuggestionResponse[]>(
    "/api/locations/search",
    {
      params: {
        q: query,
        language: getCurrentAppLanguage(),
        sessionToken,
      },
    },
  );

  return (response.data ?? []).map((item) => ({
    id: item.id,
    placeId: item.placeId,
    title: item.title,
    subtitle: item.subtitle,
    addressText: item.addressText,
    latitude: item.latitude ?? undefined,
    longitude: item.longitude ?? undefined,
  }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<SelectedLocation> {
  const response = await apiClient.get<ResolvedPlaceResponse>(
    `/api/locations/places/${encodeURIComponent(placeId)}`,
    {
      params: {
        language: getCurrentAppLanguage(),
        sessionToken,
      },
    },
  );

  return response.data;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<SelectedLocation> {
  const response = await apiClient.get<ResolvedPlaceResponse>(
    "/api/locations/reverse",
    {
      params: { lat: latitude, lng: longitude, language: getCurrentAppLanguage() },
    },
  );

  return response.data;
}
