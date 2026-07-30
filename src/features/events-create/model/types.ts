export type SportOption = {
  key: string;
  label: string;
};

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};
