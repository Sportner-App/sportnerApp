import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ApiApplyToEventResponse,
  ApiEventDetail,
  ApiEventListItem,
  ApiExploreEventItem,
  ApiExplorePerson,
  ApiParticipant,
  ApiWaitlistEntry,
  CreateEventPayload,
  CreateEventResult,
  DiscoverEventsParams,
  EventActionResult,
  EventDetail,
  EventListPage,
  EventParticipant,
  EventParticipantAssignment,
  EventWaitlistEntry,
  ExploreEventItem,
  ExplorePerson,
  PagedResult,
} from "@/types/events";
import {
  mapDetailToEvent,
  mapExploreEvent,
  mapExplorePerson,
  mapListItemToSummary,
  mapParticipant,
  mapWaitlistEntry,
} from "@/utils/events";

function toListPage(page?: PagedResult<ApiEventListItem>): EventListPage {
  const items = (page?.items ?? []).map(mapListItemToSummary);
  return {
    items,
    totalCount: page?.totalCount ?? items.length,
    page: page?.page ?? 1,
    hasNext: Boolean(page?.hasNext),
  };
}

async function eventAction(
  run: () => Promise<unknown>,
  fallback: string,
): Promise<EventActionResult<null>> {
  try {
    await run();
    return { error: null, data: null };
  } catch (error) {
    return {
      error: { message: getApiErrorMessage(error, fallback) },
      data: null,
    };
  }
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

export async function joinEvent(id: string): Promise<EventActionResult> {
  try {
    const response = await apiClient.post<ApiApplyToEventResponse>(
      `/api/events/${id}/apply`,
    );
    return { error: null, data: response.data };
  } catch (error) {
    return {
      error: { message: getApiErrorMessage(error, "Katılım başarısız") },
      data: null,
    };
  }
}

export async function acceptEventInvitation(eventId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/invitations/me/accept`),
    "Davet kabul edilemedi",
  );
}

export async function declineEventInvitation(eventId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/invitations/me/decline`),
    "Davet reddedilemedi",
  );
}

export async function assignEventParticipants(
  eventId: string,
  assignment: EventParticipantAssignment,
) {
  const response = await apiClient.post<ApiEventDetail>(
    `/api/events/${eventId}/participants/assign`,
    assignment,
  );
  return response.data;
}

export async function removeEventParticipant(
  eventId: string,
  participantId: string,
  payload: { reportReasonId: string; note?: string },
) {
  return eventAction(
    () =>
      apiClient.post(
        `/api/events/${eventId}/participants/${participantId}/remove`,
        payload,
      ),
    "Katılımcı çıkarılamadı",
  );
}

export async function cancelParticipation(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/participants/me/cancel`),
    "Ayrılma başarısız",
  );
}

export async function cancelEvent(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/cancel`),
    "Etkinlik iptal edilemedi",
  );
}

export async function completeEvent(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/complete`),
    "Etkinlik tamamlanamadı",
  );
}

export async function approveParticipant(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/approve`),
    "Onaylanamadı",
  );
}

export async function rejectParticipant(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/reject`),
    "Reddedilemedi",
  );
}

export async function promoteFromWaitlist(eventId: string, userId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/waitlist/${userId}/promote`),
    "Listeden alınamadı",
  );
}

export async function confirmAttendance(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/attended`),
    "Yoklama kaydedilemedi",
  );
}

export async function markNoShow(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/no-show`),
    "Yoklama kaydedilemedi",
  );
}

export async function listWaitlist(
  eventId: string,
): Promise<EventWaitlistEntry[]> {
  const response = await apiClient.get<ApiWaitlistEntry[]>(
    `/api/events/${eventId}/waitlist`,
  );
  return (response.data ?? []).map(mapWaitlistEntry);
}

export async function updateEventDetails(
  eventId: string,
  payload: { title: string; description: string | null },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}`, payload),
    "Etkinlik güncellenemedi",
  );
}

export async function updateEventSchedule(
  eventId: string,
  payload: { eventDate: string; durationMinutes: number },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/schedule`, payload),
    "Tarih güncellenemedi",
  );
}

export async function updateEventLocation(
  eventId: string,
  payload: { latitude: number; longitude: number; address: string },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/location`, payload),
    "Konum güncellenemedi",
  );
}

export async function updateEventCapacity(
  eventId: string,
  maxParticipants: number | null,
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/capacity`, { maxParticipants }),
    "Kapasite güncellenemedi",
  );
}

export async function updateEventFee(
  eventId: string,
  payload: { isPaid: boolean; feeAmount: number | null },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/fee`, payload),
    "Ücret bilgisi güncellenemedi",
  );
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

export async function explorePeople(params: {
  sportId?: string;
  city?: string;
  limit?: number;
}): Promise<ExplorePerson[]> {
  const response = await apiClient.get<ApiExplorePerson[]>(
    "/api/explore/people",
    { params: { ...params, limit: params.limit ?? 20 } },
  );
  return (response.data ?? []).map(mapExplorePerson);
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<CreateEventResult> {
  const title = payload.title.trim();
  const address = payload.address.trim();

  if (!title) {
    return { data: null, error: { message: "Başlık zorunlu." } };
  }

  if (title.length > 150) {
    return {
      data: null,
      error: { message: "Başlık en fazla 150 karakter olabilir." },
    };
  }

  if (!payload.sportId) {
    return { data: null, error: { message: "Spor seçimi zorunlu." } };
  }

  if (payload.durationMinutes <= 0) {
    return { data: null, error: { message: "Süre 0'dan büyük olmalı." } };
  }

  if (!address) {
    return { data: null, error: { message: "Adres zorunlu." } };
  }

  if (
    payload.latitude < -90 ||
    payload.latitude > 90 ||
    payload.longitude < -180 ||
    payload.longitude > 180
  ) {
    return { data: null, error: { message: "Konum koordinatları geçersiz." } };
  }

  if (payload.maxParticipants <= 0) {
    return {
      data: null,
      error: { message: "Oyuncu sayısı 0'dan büyük olmalı." },
    };
  }

  if (
    !Number.isInteger(payload.minParticipantAge) ||
    !Number.isInteger(payload.maxParticipantAge) ||
    payload.minParticipantAge < 13 ||
    payload.maxParticipantAge > 120 ||
    payload.minParticipantAge > payload.maxParticipantAge
  ) {
    return {
      data: null,
      error: {
        message: "Katılım yaş aralığı 13–120 arasında ve sıralı olmalı.",
      },
    };
  }

  if (payload.isPaid) {
    const fee = payload.feeAmount;
    if (fee == null || fee <= 0 || fee > 99_999.99) {
      return {
        data: null,
        error: {
          message: "Ücretli etkinlik için 0'dan büyük bir fiyat gir.",
        },
      };
    }
  }

  let eventId: string | undefined;
  let eventIds: string[] = [];

  try {
    const requestBody = {
      sportId: payload.sportId,
      title,
      description: payload.description.trim() || null,
      eventDate: payload.eventDate,
      durationMinutes: payload.durationMinutes,
      latitude: Number(payload.latitude.toFixed(6)),
      longitude: Number(payload.longitude.toFixed(6)),
      address,
      maxParticipants: payload.maxParticipants,
      minParticipantAge: payload.minParticipantAge,
      maxParticipantAge: payload.maxParticipantAge,
      skillLevel: payload.skillLevel,
      isPaid: payload.isPaid,
      feeAmount: payload.isPaid ? payload.feeAmount : null,
      organizationId: payload.organizationId || undefined,
    };
    if ((payload.recurrenceCount ?? 1) > 1) {
      const created = await apiClient.post<{
        firstEventId: string;
        eventIds: string[];
      }>("/api/events/recurring", {
        ...requestBody,
        intervalWeeks: payload.recurrenceIntervalWeeks ?? 1,
        occurrenceCount: payload.recurrenceCount,
      });
      eventId = created.data?.firstEventId;
      eventIds = created.data?.eventIds ?? [];
    } else {
      const created = await apiClient.post<ApiEventDetail>(
        "/api/events",
        requestBody,
      );
      eventId = created.data?.id;
      eventIds = eventId ? [eventId] : [];
    }

    if (!eventId) {
      return {
        data: null,
        error: { message: "Etkinlik oluşturuldu ama kimlik alınamadı." },
      };
    }
  } catch (error) {
    return {
      data: null,
      error: { message: getApiErrorMessage(error, "Etkinlik oluşturulamadı") },
    };
  }

  try {
    await Promise.all(
      eventIds.map((id) => apiClient.post(`/api/events/${id}/publish`)),
    );
    return {
      data: { id: eventId, ids: eventIds, published: true },
      error: null,
    };
  } catch (error) {
    return {
      data: { id: eventId, ids: eventIds, published: false },
      error: {
        message: getApiErrorMessage(
          error,
          "Etkinlik taslak olarak kaldı; yayınlanamadı.",
        ),
      },
    };
  }
}
