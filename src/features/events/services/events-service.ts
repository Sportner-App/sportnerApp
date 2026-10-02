import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/types/api";
import type {
  ApiEventDetail,
  ApiEventListItem,
  ApiExploreEventItem,
  ApiParticipant,
  ApiPendingAttendanceEvent,
  ApiWaitlistEntry,
  DiscoverEventsParams,
  EventDetail,
  EventListPage,
  EventParticipant,
  EventWaitlistEntry,
  ExploreEventItem,
  PendingAttendanceEvent,
} from "@/features/events/types";
import {
  mapDetailToEvent,
  mapExploreEvent,
  mapListItemToSummary,
  mapParticipant,
  mapPendingAttendanceEvent,
  mapWaitlistEntry,
} from "@/features/events/mappers";

function toListPage(page?: PagedResult<ApiEventListItem>): EventListPage {
  const items = (page?.items ?? []).map(mapListItemToSummary);
  return {
    items,
    totalCount: page?.totalCount ?? items.length,
    page: page?.page ?? 1,
    hasNext: Boolean(page?.hasNext),
  };
}

export async function getEvents(
  params: DiscoverEventsParams = {},
): Promise<EventListPage> {
  const response = await apiClient.get<PagedResult<ApiEventListItem>>(
    "/api/events",
    {
      params: {
        sportId: params.sportId,
        sportCategoryId: params.sportCategoryId,
        city: params.city,
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm,
        minAge: params.minAge,
        maxAge: params.maxAge,
        gender: params.gender,
        skillLevel: params.skillLevel,
        isPaid: params.isPaid,
        friendsOnly: params.friendsOnly || undefined,
        organizationsOnly: params.organizationsOnly || undefined,
        organizationId: params.organizationId || undefined,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    },
  );

  return toListPage(response.data);
}

export async function getMyOrganizedEvents(
  page = 1,
  pageSize = 20,
): Promise<EventListPage> {
  const response = await apiClient.get<PagedResult<ApiEventListItem>>(
    "/api/events/mine/organized",
    { params: { page, pageSize } },
  );
  return toListPage(response.data);
}

export async function getMyParticipatingEvents(
  page = 1,
  pageSize = 20,
  scope?: "upcoming" | "past",
): Promise<EventListPage> {
  const response = await apiClient.get<PagedResult<ApiEventListItem>>(
    "/api/events/mine/participating",
    { params: { page, pageSize, scope } },
  );
  return toListPage(response.data);
}

export async function getEventById(id: string): Promise<EventDetail | null> {
  try {
    const [detailResponse, participantsResponse, waitlistResponse] =
      await Promise.all([
        apiClient.get<ApiEventDetail>(`/api/events/${id}`),
        apiClient
          .get<ApiParticipant[]>(`/api/events/${id}/participants`)
          .catch(() => ({ data: [] as ApiParticipant[] })),
        apiClient
          .get<ApiWaitlistEntry[]>(`/api/events/${id}/waitlist`)
          .catch(() => ({ data: [] as ApiWaitlistEntry[] })),
      ]);

    if (!detailResponse.data) {
      return null;
    }

    const event = mapDetailToEvent(
      detailResponse.data,
      participantsResponse.data ?? [],
    );
    event.waitlist = (waitlistResponse.data ?? []).map(mapWaitlistEntry);
    return event;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getEventParticipants(
  eventId: string,
): Promise<EventParticipant[]> {
  const response = await apiClient.get<ApiParticipant[]>(
    `/api/events/${eventId}/participants`,
  );
  return (response.data ?? []).map(mapParticipant);
}

/** GET /api/events/mine/pending-attendance */
export async function listPendingAttendanceEvents(): Promise<
  PendingAttendanceEvent[]
> {
  const response = await apiClient.get<ApiPendingAttendanceEvent[]>(
    "/api/events/mine/pending-attendance",
  );
  return (response.data ?? []).map(mapPendingAttendanceEvent);
}

export async function listWaitlist(
  eventId: string,
): Promise<EventWaitlistEntry[]> {
  const response = await apiClient.get<ApiWaitlistEntry[]>(
    `/api/events/${eventId}/waitlist`,
  );
  return (response.data ?? []).map(mapWaitlistEntry);
}

export async function exploreEvents(params: {
  sportId?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  skillLevel?: number;
  limit?: number;
}): Promise<ExploreEventItem[]> {
  const response = await apiClient.get<ApiExploreEventItem[]>(
    "/api/explore/events",
    { params: { ...params, limit: params.limit ?? 20 } },
  );
  return (response.data ?? []).map(mapExploreEvent);
}
