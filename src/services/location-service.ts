import i18n from "@/i18n";
import {
  getPlaceDetails,
  reverseGeocode as reverseGeocodeRequest,
  searchPlaces,
} from "@/services/location/places-api";
import type { LocationSuggestion, SelectedLocation } from "@/types/location";

/**
 * Sağlayıcı seçimi (Google Places / Nominatim) artık sunucuda; burada yalnızca
 * oturum kimliği yönetiliyor. Anahtar uygulamaya hiç girmiyor.
 */

const MIN_QUERY_LENGTH = 2;

/**
 * Google, bir adres seçimi boyunca atılan autocomplete isteklerini ve onu
 * kapatan details çağrısını aynı sessionToken ile gönderirsek tek oturum
 * olarak faturalandırıyor — her tuş vuruşunu ayrı ödemek yerine.
 * Bu yüzden token seçim tamamlanana kadar korunur, sonra yenilenir.
 */
let sessionToken = createSessionToken();

function createSessionToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function endSession() {
  sessionToken = createSessionToken();
}

/** Adres arama (autocomplete). */
export async function searchLocations(
  query: string,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }

  return searchPlaces(trimmed, sessionToken);
}

/**
 * Öneri seçildiğinde lat/lng + adres döner ve arama oturumunu kapatır.
 * Sağlayıcı koordinatı zaten verdiyse (Nominatim böyle) ikinci istek atılmaz.
 */
export async function resolveLocationSuggestion(
  suggestion: LocationSuggestion,
): Promise<SelectedLocation> {
  try {
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

    if (!suggestion.placeId) {
      throw new Error(i18n.t("location:resolveFailed"));
    }

    return await getPlaceDetails(suggestion.placeId, sessionToken);
  } finally {
    // Seçim bitti: başarılı da olsa hatalı da olsa sonraki arama yeni bir
    // oturum sayılmalı, yoksa Google eski token'ı geçersiz sayar.
    endSession();
  }
}

/** Haritada seçilen noktayı adrese çevirir. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<SelectedLocation> {
  return reverseGeocodeRequest(latitude, longitude);
}
