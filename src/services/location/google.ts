import type { LocationSuggestion, SelectedLocation } from "@/types/location";

const GOOGLE_BASE_URL = "https://maps.googleapis.com/maps/api";

type GoogleAutocompleteResponse = {
  status: string;
  error_message?: string;
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text: string;
      secondary_text?: string;
    };
  }>;
};

type GooglePlaceDetailsResponse = {
  status: string;
  error_message?: string;
  result: {
    formatted_address: string;
    name?: string;
    geometry: {
      location: { lat: number; lng: number };
    };
  };
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
};

function getApiKey() {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export function hasGoogleMapsKey() {
  return getApiKey().length > 0;
}

export async function searchWithGoogle(
  query: string,
): Promise<LocationSuggestion[]> {
  const url = new URL(`${GOOGLE_BASE_URL}/place/autocomplete/json`);
  url.searchParams.set("input", query);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("language", "tr");
  url.searchParams.set("components", "country:tr");

  const response = await fetch(url.toString());
  const data = (await response.json()) as GoogleAutocompleteResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || "Google konum araması başarısız.");
  }

  return (data.predictions ?? []).map((prediction) => ({
    id: prediction.place_id,
    placeId: prediction.place_id,
    title:
      prediction.structured_formatting?.main_text ||
      prediction.description.split(",")[0] ||
      prediction.description,
    subtitle:
      prediction.structured_formatting?.secondary_text ||
      prediction.description,
    addressText: prediction.description,
  }));
}

export async function getGooglePlaceDetails(
  placeId: string,
): Promise<SelectedLocation> {
  const url = new URL(`${GOOGLE_BASE_URL}/place/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "formatted_address,geometry,name");
  url.searchParams.set("language", "tr");
  url.searchParams.set("key", getApiKey());

  const response = await fetch(url.toString());
  const data = (await response.json()) as GooglePlaceDetailsResponse;

  if (data.status !== "OK" || !data.result?.geometry?.location) {
    throw new Error(data.error_message || "Konum detayı alınamadı.");
  }

  return {
    addressText: data.result.formatted_address || data.result.name || "Konum",
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
  };
}

export async function reverseWithGoogle(
  latitude: number,
  longitude: number,
): Promise<SelectedLocation> {
  const url = new URL(`${GOOGLE_BASE_URL}/geocode/json`);
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("language", "tr");
  url.searchParams.set("key", getApiKey());

  const response = await fetch(url.toString());
  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(data.error_message || "Adres çözümlenemedi.");
  }

  return {
    addressText: data.results[0].formatted_address,
    latitude,
    longitude,
  };
}
