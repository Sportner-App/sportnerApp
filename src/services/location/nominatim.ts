import type { LocationSuggestion, SelectedLocation } from "@/types/location";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "SportnerApp/1.0 (contact@sportner.app)";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    district?: string;
    province?: string;
    state?: string;
    country?: string;
  };
};

export async function searchWithNominatim(
  query: string,
): Promise<LocationSuggestion[]> {
  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "tr");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error("Konum araması başarısız.");
  }

  const results = (await response.json()) as NominatimResult[];
  return results.map(mapNominatimResult);
}

export async function reverseWithNominatim(
  latitude: number,
  longitude: number,
): Promise<SelectedLocation> {
  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error("Adres çözümlenemedi.");
  }

  const result = (await response.json()) as NominatimResult;
  const mapped = mapNominatimResult(result);

  return {
    addressText: mapped.addressText,
    latitude,
    longitude,
  };
}

function mapNominatimResult(result: NominatimResult): LocationSuggestion {
  const address = result.address;
  const title =
    result.name ||
    address?.road ||
    address?.neighbourhood ||
    address?.suburb ||
    address?.town ||
    address?.city ||
    "Seçilen konum";

  const subtitleParts = [
    address?.suburb || address?.neighbourhood,
    address?.city || address?.town || address?.district,
    address?.province || address?.state,
  ].filter(Boolean);

  const subtitle =
    subtitleParts.length > 0
      ? subtitleParts.join(", ")
      : result.display_name.split(",").slice(1, 3).join(",").trim();

  return {
    id: String(result.place_id),
    title,
    subtitle,
    addressText: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  };
}
