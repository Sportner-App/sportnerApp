import { EVENT_STATUS, PARTICIPANT_STATUS } from "@/features/events/types";

/** Confirmed roster: approved, attended, no-show. Pending applicants are not members yet. */
export function isCurrentParticipant(status: number): boolean {
  return (
    status === PARTICIPANT_STATUS.approved ||
    status === PARTICIPANT_STATUS.attended ||
    status === PARTICIPANT_STATUS.noShow
  );
}

/** Pending / Approved / Attended count as an active application for UI. */
export function hasActiveParticipation(
  status: number | null | undefined,
  isOnWaitlist = false,
): boolean {
  if (isOnWaitlist) {
    return true;
  }

  return (
    status === PARTICIPANT_STATUS.pending ||
    status === PARTICIPANT_STATUS.invited ||
    status === PARTICIPANT_STATUS.approved ||
    status === PARTICIPANT_STATUS.attended
  );
}

export function hasEventInvitation(status: number | null | undefined): boolean {
  return status === PARTICIPANT_STATUS.invited;
}

export function hasPendingParticipation(
  status: number | null | undefined,
): boolean {
  return status === PARTICIPANT_STATUS.pending;
}

export function hasApprovedParticipation(
  status: number | null | undefined,
): boolean {
  return (
    status === PARTICIPANT_STATUS.approved ||
    status === PARTICIPANT_STATUS.attended
  );
}

export function hasEventEnded(
  event: {
    status: number;
    eventDate: string;
    durationMinutes: number;
  },
  now = Date.now(),
): boolean {
  if (
    event.status === EVENT_STATUS.cancelled ||
    event.status === EVENT_STATUS.completed
  ) {
    return true;
  }

  const start = new Date(event.eventDate).getTime();
  if (Number.isNaN(start)) {
    return false;
  }

  return start + event.durationMinutes * 60_000 <= now;
}

/** Activity "geçmiş": start time has passed, or the event was closed. */
export function hasEventStartedOrClosed(
  event: {
    status: number;
    eventDate: string;
  },
  now = Date.now(),
): boolean {
  if (
    event.status === EVENT_STATUS.cancelled ||
    event.status === EVENT_STATUS.completed
  ) {
    return true;
  }

  const start = new Date(event.eventDate).getTime();
  if (Number.isNaN(start)) {
    return false;
  }

  return start <= now;
}

export function canAccessEventChat(
  status: number | null | undefined,
  isOrganizer: boolean,
  conversationId: string | null | undefined,
  _eventStatus: number,
): boolean {
  if (!conversationId) {
    return false;
  }

  return isOrganizer || hasApprovedParticipation(status);
}
