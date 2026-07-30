import { apiClient } from "@/shared/api/client";

type CreateEventPayload = {
  title: string;
  description: string;
  sportType: string;
  eventDate: string;
  maxPlayers: number;
  addressText: string;
  latitude: number;
  longitude: number;
  createdBy: string;
};

export async function createEvent(payload: CreateEventPayload) {
  return apiClient.post("/api/events", {
    title: payload.title,
    description: payload.description,
    sportType: payload.sportType,
    eventDate: payload.eventDate,
    maxPlayers: payload.maxPlayers,
    addressText: payload.addressText,
    latitude: payload.latitude,
    longitude: payload.longitude,
    createdBy: payload.createdBy,
  });
}
