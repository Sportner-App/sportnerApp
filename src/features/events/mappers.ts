import i18n from "@/i18n";
import {
  type ApiEventDetail,
  type ApiEventListItem,
  type ApiExploreEventItem,
  type ApiOrganizerSnippet,
  type ApiParticipant,
  type ApiParticipantAvatar,
  type ApiWaitlistEntry,
  type EventDetail,
  type EventParticipant,
  type EventSummary,
  type EventWaitlistEntry,
  type ExploreEventItem,
  type ParticipantAvatarPreview,
  type ApiPendingAttendanceEvent,
  type PendingAttendanceEvent,
} from "@/features/events/types";
import { formatFullName, formatPersonName } from "@/utils/person";
import { sportIconForSlug } from "@/features/sports/sports";

import { shortLocation } from "@/features/events/address";
import {
  formatDurationLabel,
  formatEventDateLabel,
  noDescriptionLabel,
} from "@/features/events/format";

function mapParticipantAvatarPreview(
  avatar: ApiParticipantAvatar,
): ParticipantAvatarPreview {
  return {
    userId: avatar.userId,
    name: avatar.name?.trim() || i18n.t("events:fallback.unnamedGuest"),
    avatarUrl: avatar.profileImageUrl,
    isGuest: avatar.isGuest,
  };
}

export function mapListItemToSummary(item: ApiEventListItem): EventSummary {
  return {
    id: item.id,
    title: item.title,
    sportId: item.sportId,
    sport: item.sportSlug,
    sportName: item.sportName,
    sportIcon: sportIconForSlug(item.sportSlug),
    sportCoverImageUrl: item.sportCoverImageUrl ?? null,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    dateLabel: formatEventDateLabel(item.eventDate),
    eventDate: item.eventDate,
    location: shortLocation(item.address),
    participantCount: item.occupiedParticipantCount,
    participantAvatars: (item.participantAvatars ?? []).map(
      mapParticipantAvatarPreview,
    ),
    maxParticipants: item.maxParticipants,
    minParticipantAge: item.minParticipantAge,
    maxParticipantAge: item.maxParticipantAge,
    participantGender: item.participantGender ?? null,
    skillLevel: item.skillLevel ?? null,
    isPaid: item.isPaid === true,
    feeAmount: item.feeAmount ?? null,
    hostName: item.organizerUsername
      ? `@${item.organizerUsername}`
      : i18n.t("events:fallback.organizer"),
    status: item.status,
    durationMinutes: item.durationMinutes,
    myParticipationStatus: item.myParticipationStatus ?? null,
  };
}

export function mapDetailToEvent(
  detail: ApiEventDetail,
  participants: ApiParticipant[] = [],
): EventDetail {
  const organizer: ApiOrganizerSnippet = detail.organizer;

  return {
    id: detail.id,
    title: detail.title,
    sportId: detail.sportId,
    sport: detail.sportSlug,
    sportName: detail.sportName,
    sportIcon: sportIconForSlug(detail.sportSlug),
    sportCoverImageUrl: detail.sportCoverImageUrl ?? null,
    latitude: Number(detail.latitude),
    longitude: Number(detail.longitude),
    dateLabel: formatEventDateLabel(detail.eventDate),
    eventDate: detail.eventDate,
    location: shortLocation(detail.address),
    participantCount: detail.occupiedParticipantCount,
    // Detail screen renders participants from the full `participants` list
    // (EventCapacitySummary), not from this card-preview field.
    participantAvatars: [],
    maxParticipants: detail.maxParticipants,
    minParticipantAge: detail.minParticipantAge,
    maxParticipantAge: detail.maxParticipantAge,
    participantGender: detail.participantGender ?? null,
    skillLevel: detail.skillLevel ?? null,
    isPaid: detail.isPaid === true,
    feeAmount: detail.feeAmount ?? null,
    hostName: formatPersonName(organizer),
    status: detail.status,
    durationMinutes: detail.durationMinutes,
    description: detail.description?.trim() || noDescriptionLabel(),
    address: detail.address,
    durationLabel: formatDurationLabel(detail.durationMinutes),
    participants: participants.map(mapParticipant),
    waitlist: [],
    myParticipationStatus: detail.myParticipationStatus,
    isOnWaitlist: detail.isOnWaitlist,
    waitlistCount: detail.waitlistCount,
    conversationId: detail.conversationId,
    organizerUserId: organizer.userId,
    organizationId: detail.organizationId ?? null,
    organizationName: detail.organizationName ?? null,
    canCancel: detail.canCancel === true,
  };
}

export function mapPendingAttendanceEvent(
  event: ApiPendingAttendanceEvent,
): PendingAttendanceEvent {
  return {
    eventId: event.eventId,
    title: event.title,
    eventDate: event.eventDate,
    participants: event.participants.map((participant) => ({
      userId: participant.userId,
      name: formatPersonName(participant),
      avatarUrl: participant.profileImageUrl,
    })),
  };
}

export function mapParticipant(participant: ApiParticipant): EventParticipant {
  const isGuest = participant.isGuest || participant.kind === 1;
  const guestName = formatFullName(participant.firstName, participant.lastName);

  return {
    id: participant.id,
    userId: participant.userId,
    kind: participant.kind,
    isGuest,
    name: isGuest
      ? guestName || i18n.t("events:fallback.unnamedGuest")
      : formatPersonName(participant),
    username: participant.username,
    avatarUrl: participant.profileImageUrl,
    status: participant.status,
    canReview: participant.canReview,
  };
}

export function mapWaitlistEntry(entry: ApiWaitlistEntry): EventWaitlistEntry {
  return {
    userId: entry.userId,
    name: formatPersonName(entry),
    username: entry.username,
    avatarUrl: entry.profileImageUrl,
    position: entry.position,
  };
}

export function mapExploreEvent(item: ApiExploreEventItem): ExploreEventItem {
  return {
    ...mapListItemToSummary(item),
    distanceKm: item.distanceKm,
    friendsAttending: item.friendsAttending,
    sportMatch: item.sportMatch,
  };
}
