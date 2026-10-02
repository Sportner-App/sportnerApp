import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";
import type {
  ApiEventDetail,
  EventParticipantAssignment,
} from "@/features/events/types";

import { eventAction } from "./event-action";

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
    i18n.t("events:service.removeParticipantFailed"),
  );
}

export async function cancelEvent(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/cancel`),
    i18n.t("events:service.cancelEventFailed"),
  );
}

export async function completeEvent(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/complete`),
    i18n.t("events:service.completeEventFailed"),
  );
}

export async function approveParticipant(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/approve`),
    i18n.t("events:service.approveFailed"),
  );
}

export async function rejectParticipant(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/reject`),
    i18n.t("events:service.rejectFailed"),
  );
}

export async function promoteFromWaitlist(eventId: string, userId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/waitlist/${userId}/promote`),
    i18n.t("events:service.promoteWaitlistFailed"),
  );
}

export async function confirmAttendance(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/attended`),
    i18n.t("events:service.attendanceFailed"),
  );
}

export async function markNoShow(eventId: string, userId: string) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/participants/${userId}/no-show`),
    i18n.t("events:service.attendanceFailed"),
  );
}

/**
 * POST /api/events/{id}/attendance/confirm-all — marks every still-pending participant
 * Attended, except whoever is listed in `absentUserIds` (marked No-Show instead).
 */
export async function confirmAllAttendance(
  eventId: string,
  absentUserIds?: string[],
) {
  return eventAction(
    () =>
      apiClient.post(`/api/events/${eventId}/attendance/confirm-all`, {
        absentUserIds: absentUserIds?.length ? absentUserIds : null,
      }),
    i18n.t("events:service.attendanceFailed"),
  );
}

export async function updateEventDetails(
  eventId: string,
  payload: { title: string; description: string | null },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}`, payload),
    i18n.t("events:service.updateDetailsFailed"),
  );
}

export async function updateEvent(
  eventId: string,
  payload: {
    title: string;
    description: string | null;
    eventDate: string;
    durationMinutes: number;
    latitude: number;
    longitude: number;
    address: string;
    maxParticipants: number | null;
    isPaid: boolean;
    feeAmount: number | null;
  },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/edit`, payload),
    i18n.t("events:service.updateDetailsFailed"),
  );
}

export async function updateEventSchedule(
  eventId: string,
  payload: { eventDate: string; durationMinutes: number },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/schedule`, payload),
    i18n.t("events:service.updateScheduleFailed"),
  );
}

export async function updateEventLocation(
  eventId: string,
  payload: { latitude: number; longitude: number; address: string },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/location`, payload),
    i18n.t("events:service.updateLocationFailed"),
  );
}

export async function updateEventCapacity(
  eventId: string,
  maxParticipants: number | null,
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/capacity`, { maxParticipants }),
    i18n.t("events:service.updateCapacityFailed"),
  );
}

export async function updateEventFee(
  eventId: string,
  payload: { isPaid: boolean; feeAmount: number | null },
) {
  return eventAction(
    () => apiClient.put(`/api/events/${eventId}/fee`, payload),
    i18n.t("events:service.updateFeeFailed"),
  );
}
