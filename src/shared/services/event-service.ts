import { apiClient } from "@/shared/api/client";

export type Event = {
  eventId: string;
  title: string;
  description?: string;
  sportType: string;
  eventDate: string;
  maxPlayers: number;
  currentPlayers: number;
  addressText: string;
  latitude: number;
  longitude: number;
  createdBy: string;
  createdAt: string;
  status?: string;
  participants?: string[];
  organizerDetails?: {
    userId: string;
    fullName: string;
    avatarUrl?: string;
  };
  [key: string]: any;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  sportType: string;
  eventDate: string;
  maxPlayers: number;
  addressText: string;
  latitude: number;
  longitude: number;
};

export type EventListFilters = {
  sportType?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  pageSize?: number;
  pageIndex?: number;
};

export async function fetchEvents(
  filters?: EventListFilters,
): Promise<Event[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.sportType) params.append("sportType", filters.sportType);
    if (filters?.latitude) params.append("latitude", String(filters.latitude));
    if (filters?.longitude)
      params.append("longitude", String(filters.longitude));
    if (filters?.radiusKm) params.append("radiusKm", String(filters.radiusKm));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.pageIndex)
      params.append("pageIndex", String(filters.pageIndex));

    const url = `/api/Events${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<Event[]>(url);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Etkinlikler alınamadı";
    throw new Error(message);
  }
}

/**
 * Etkinlik detayı
 * GET /api/Events/{eventId}
 */
export async function fetchEvent(eventId: string): Promise<Event> {
  try {
    const response = await apiClient.get<Event>(`/api/Events/${eventId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || "Etkinlik alınamadı";
    throw new Error(message);
  }
}

/**
 * Etkinlik oluştur
 * POST /api/Events
 */
export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  try {
    const response = await apiClient.post<Event>("/api/Events", payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Etkinlik oluşturma başarısız";
    throw new Error(message);
  }
}

/**
 * Etkinliğe katıl
 * POST /api/Events/{eventId}/join
 */
export async function joinEvent(eventId: string): Promise<Event> {
  try {
    const response = await apiClient.post<Event>(`/api/Events/${eventId}/join`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Etkinliğe katılma başarısız";
    throw new Error(message);
  }
}

/**
 * Etkinlikten ayrıl
 * POST /api/Events/{eventId}/leave
 */
export async function leaveEvent(eventId: string): Promise<Event> {
  try {
    const response = await apiClient.post<Event>(
      `/api/Events/${eventId}/leave`,
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Etkinlikten ayrılma başarısız";
    throw new Error(message);
  }
}

/**
 * Kullanıcının geçmiş etkinlikleri
 * GET /api/Events/me/past
 */
export async function fetchMyPastEvents(): Promise<Event[]> {
  try {
    const response = await apiClient.get<Event[]>("/api/Events/me/past");
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Geçmiş etkinlikler alınamadı";
    throw new Error(message);
  }
}

/**
 * Kullanıcının yaklaşan etkinlikleri
 * GET /api/Events/me/upcoming
 */
export async function fetchMyUpcomingEvents(): Promise<Event[]> {
  try {
    const response = await apiClient.get<Event[]>("/api/Events/me/upcoming");
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Yaklaşan etkinlikler alınamadı";
    throw new Error(message);
  }
}
