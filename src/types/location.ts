export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type LocationSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  addressText: string;
  /** Nominatim sonuçlarında dolu; Google autocomplete'te details sonrası gelir */
  latitude?: number;
  longitude?: number;
  /** Google Places place_id */
  placeId?: string;
};

export type SelectedLocation = {
  addressText: string;
  latitude: number;
  longitude: number;
};
