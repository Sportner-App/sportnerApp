import { Platform } from "react-native";

import i18n from "@/i18n";
import {
  getGooglePlaceDetails,
  hasGoogleMapsKey,
  reverseWithGoogle,
  searchWithGoogle,
} from "@/services/location/google";
import {
  reverseWithNominatim,
  searchWithNominatim,
} from "@/services/location/nominatim";
import type { LocationSuggestion, SelectedLocation } from "@/types/location";

export function isGooglePlacesEnabled() {
  return hasGoogleMapsKey();
}

/**
 * Android'de react-native-maps'in tek sağlayıcısı Google Maps: manifest'te
 * `com.google.android.geo.API_KEY` yoksa MapView mount edilir edilmez
 * IllegalStateException fırlatıp uygulamayı çökertiyor. iOS'ta anahtar
 * olmadan Apple Maps'e düşülebildiği için harita çalışmaya devam ediyor.
 */
export function isNativeMapAvailable() {
  return Platform.OS !== "android" || hasGoogleMapsKey();
}

/**
 * Adres arama (autocomplete)
 * Key varsa Google Places, yoksa Nominatim.
 */
export async function searchLocations(
  query: string,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  return hasGoogleMapsKey()
    ? searchWithGoogle(trimmed)
    : searchWithNominatim(trimmed);
}

/**
 * Öneri seçildiğinde lat/lng + adres döner.
 * Google'da place details; Nominatim'de zaten dolu alanlar kullanılır.
 */
export async function resolveLocationSuggestion(
  suggestion: LocationSuggestion,
): Promise<SelectedLocation> {
  if (
    suggestion.latitude != null &&
    suggestion.longitude != null &&
    suggestion.addressText
  ) {
    return {
      addressText: suggestion.addressText,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
  }

  if (hasGoogleMapsKey() && suggestion.placeId) {
    return getGooglePlaceDetails(suggestion.placeId);
  }

  throw new Error(i18n.t("location:resolveFailed"));
}

/**
 * Haritada seçilen noktayı adrese çevirir
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<SelectedLocation> {
  return hasGoogleMapsKey()
    ? reverseWithGoogle(latitude, longitude)
    : reverseWithNominatim(latitude, longitude);
}
