import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ApiEventDetail,
  CreateEventPayload,
  CreateEventResult,
} from "@/features/events/types";
import { BIRTH_DATE_MAX_AGE, BIRTH_DATE_MIN_AGE } from "@/constants/validation";

const EVENT_TITLE_MAX_LENGTH = 150;
const EVENT_FEE_MAX_AMOUNT = 99_999.99;

/** Limitler API ile aynı; ilk bozuk alanın hata anahtarını döner. */
function validateCreateEventPayload(
  payload: CreateEventPayload,
  title: string,
  address: string,
): string | null {
  if (!title) return "titleRequired";
  if (title.length > EVENT_TITLE_MAX_LENGTH) return "titleTooLong";
  if (!payload.sportId) return "sportRequired";
  if (payload.durationMinutes <= 0) return "durationPositive";
  if (!address) return "addressRequired";
  if (
    payload.latitude < -90 ||
    payload.latitude > 90 ||
    payload.longitude < -180 ||
    payload.longitude > 180
  ) {
    return "coordinatesInvalid";
  }
  if (payload.maxParticipants <= 0) return "capacityPositive";
  if (
    !Number.isInteger(payload.minParticipantAge) ||
    !Number.isInteger(payload.maxParticipantAge) ||
    payload.minParticipantAge < BIRTH_DATE_MIN_AGE ||
    payload.maxParticipantAge > BIRTH_DATE_MAX_AGE ||
    payload.minParticipantAge > payload.maxParticipantAge
  ) {
    return "ageRangeInvalid";
  }
  if (payload.isPaid) {
    const fee = payload.feeAmount;
    if (fee == null || fee <= 0 || fee > EVENT_FEE_MAX_AMOUNT) {
      return "paidFeeRequired";
    }
  }
  return null;
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<CreateEventResult> {
  const title = payload.title.trim();
  const address = payload.address.trim();

  const invalid = validateCreateEventPayload(payload, title, address);
  if (invalid) {
    return {
      data: null,
      error: { message: i18n.t(`events:service.validation.${invalid}`) },
    };
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
      participantGender: payload.participantGender,
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
        error: { message: i18n.t("events:service.createMissingId") },
      };
    }
  } catch (error) {
    return {
      data: null,
      error: {
        message: getApiErrorMessage(
          error,
          i18n.t("events:service.createFailed"),
        ),
      },
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
          i18n.t("events:service.publishFailed"),
        ),
      },
    };
  }
}
