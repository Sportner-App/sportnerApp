import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ApiApplyToEventResponse,
  EventActionResult,
} from "@/features/events/types";

import { eventAction } from "./event-action";

export async function joinEvent(id: string): Promise<EventActionResult> {
  try {
    const response = await apiClient.post<ApiApplyToEventResponse>(
      `/api/events/${id}/apply`,
    );
    return { error: null, data: response.data };
  } catch (error) {
    return {
      error: {
        message: getApiErrorMessage(error, i18n.t("events:service.joinFailed")),
      },
      data: null,
    };
  }
}

export async function acceptEventInvitation(eventId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/invitations/me/accept`),
    i18n.t("events:service.acceptInvitationFailed"),
  );
}

export async function declineEventInvitation(eventId: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${eventId}/invitations/me/decline`),
    i18n.t("events:service.declineInvitationFailed"),
  );
}

export async function cancelParticipation(id: string) {
  return eventAction(
    () => apiClient.post(`/api/events/${id}/participants/me/cancel`),
    i18n.t("events:service.cancelParticipationFailed"),
  );
}
