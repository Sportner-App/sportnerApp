import type { MapStyleElement } from "react-native-maps";

import { DEFAULT_EVENT_LOCATION } from "@/constants/events";

export const MAP_INITIAL_REGION = {
  latitude: DEFAULT_EVENT_LOCATION.latitude,
  longitude: DEFAULT_EVENT_LOCATION.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
} as const;

/** Google Maps (Android) için markaya yakın koyu stil */
export const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#152238" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#132033" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e2d46" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#243552" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#152238" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0b1220" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
];
