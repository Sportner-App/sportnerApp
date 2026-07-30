import type {
  Coordinate,
  NominatimResult,
} from "@/features/events-create/model/types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "sportner-app/1.0 (expo)",
};

export async function searchLocationSuggestions(query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [] as NominatimResult[];
  }

  const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(trimmedQuery)}&addressdetails=1&limit=5`;
  const response = await fetch(url, { headers: REQUEST_HEADERS });

  if (!response.ok) {
    throw new Error("Konum araması yapılamadı.");
  }

  return (await response.json()) as NominatimResult[];
}

export async function reverseGeocodeCoordinate({
  latitude,
  longitude,
}: Coordinate) {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  const response = await fetch(url, { headers: REQUEST_HEADERS });

  if (!response.ok) {
    throw new Error("Adres bilgisi alınamadı.");
  }

  const data = (await response.json()) as {
    display_name?: string;
  };

  return data.display_name ?? "";
}
