import i18n, { getCurrentLocale } from "@/i18n";
import type { IconName } from "@/types/components";
import {
  EVENT_STATUS,
  PARTICIPANT_STATUS,
  type ApiEventDetail,
  type ApiEventListItem,
  type ApiExploreEventItem,
  type ApiExplorePerson,
  type ApiOrganizerSnippet,
  type ApiParticipant,
  type ApiParticipantAvatar,
  type ApiWaitlistEntry,
  type EventDetail,
  type EventParticipant,
  type EventSummary,
  type EventWaitlistEntry,
  type ExploreEventItem,
  type ExplorePerson,
  type ParticipantAvatarPreview,
} from "@/types/events";

const SPORT_ICON_BY_SLUG: Record<string, IconName> = {
  futbol: "futbol",
  football: "futbol",
  basketbol: "basketball",
  basketball: "basketball",
  voleybol: "volleyball",
  volleyball: "volleyball",
  tenis: "table-tennis-paddle-ball",
  tennis: "table-tennis-paddle-ball",
  "masa-tenisi": "table-tennis-paddle-ball",
  kosu: "person-running",
  running: "person-running",
  bisiklet: "bicycle",
  cycling: "bicycle",
  yuzme: "person-swimming",
  swimming: "person-swimming",
  fitness: "dumbbell",
  "doga-yuruyusu": "person-hiking",
  hiking: "person-hiking",
  boks: "hand-fist",
  boxing: "hand-fist",
  pilates: "spa",
  yoga: "spa",
  crossfit: "dumbbell",
  badminton: "table-tennis-paddle-ball",
  kurek: "sailboat",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @deprecated `@/i18n`'deki `getCurrentLocale()`'ı doğrudan kullan. Bu, geriye
 * dönük uyumluluk için tutulan bir takma ad — mevcut çağrı yerlerini kırmamak
 * için burada bırakıldı.
 */
export const currentDateLocale = getCurrentLocale;

export function sportIconForSlug(slug: string): IconName {
  return SPORT_ICON_BY_SLUG[slug.toLowerCase()] ?? "shapes";
}

export function formatEventTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(currentDateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Rozet metninden bağımsız aciliyet kontrolü — `relativeEventBadge`'in
 * dönüş metni dile göre değiştiği için ("BUGÜN" vs "TODAY") rozet rengi gibi
 * davranışsal kararlar bu metne değil doğrudan tarihe bakmalı.
 */
export function isEventToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

/** BUGÜN / YARIN / N GÜN SONRA — uzak tarihlerde null. */
export function relativeEventBadge(isoDate: string): string | null {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) {
    return i18n.t("events:badge.today");
  }

  if (dayDiff === 1) {
    return i18n.t("events:badge.tomorrow");
  }

  if (dayDiff >= 2 && dayDiff <= 6) {
    return i18n.t("events:badge.inDays", { count: dayDiff });
  }

  return null;
}

export function formatEventDateLabel(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const time = date.toLocaleTimeString(currentDateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) {
    return `${i18n.t("events:dateLabel.today")} · ${time}`;
  }

  if (dayDiff === 1) {
    return `${i18n.t("events:dateLabel.tomorrow")} · ${time}`;
  }

  if (dayDiff > 1 && dayDiff < 7) {
    const weekdaysShort = i18n.t("events:weekdaysShort", {
      returnObjects: true,
    }) as string[];
    return `${weekdaysShort[date.getDay()]} · ${time}`;
  }

  const dayMonth = date.toLocaleDateString(currentDateLocale(), {
    day: "numeric",
    month: "short",
  });

  return `${dayMonth} · ${time}`;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) {
    return i18n.t("events:duration.minutes", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return i18n.t("events:duration.hours", { count: hours });
  }

  return i18n.t("events:duration.hoursAndMinutes", { hours, minutes: rest });
}

export function formatPersonName(parts: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  const full = [parts.firstName, parts.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (full) {
    return full;
  }

  if (parts.username?.trim()) {
    return `@${parts.username.trim()}`;
  }

  return i18n.t("events:fallback.athlete");
}

function isPostcode(value: string) {
  return /^\d{4,6}$/.test(value);
}

function isCountryOrRegion(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return (
    normalized === "türkiye" ||
    normalized === "turkey" ||
    normalized.endsWith(" bölgesi")
  );
}

function isMajorCity(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return (
    normalized === "istanbul" ||
    normalized === "ankara" ||
    normalized === "izmir" ||
    normalized === "bursa" ||
    normalized === "antalya"
  );
}

function isStreet(value: string) {
  return /(bulvarı|bulvar|caddesi|cadde|cad\.?|cd\.?|sokak|sokağı|sk\.?)$/i.test(
    value,
  );
}

function stripMahalle(value: string) {
  return value.replace(/\s+(mahallesi|mah\.?)$/i, "").trim();
}

function shortenPlaceName(value: string) {
  const cleaned = stripMahalle(value);
  if (cleaned.length <= 28) {
    return cleaned;
  }

  return `${cleaned.slice(0, 25)}…`;
}

function addressParts(value: string): string[] {
  const parts: string[] = [];
  let start = 0;

  for (let index = 0; index <= value.length; index += 1) {
    const character = value[index];
    if (index !== value.length && character !== "," && character !== "/") {
      continue;
    }

    const part = value.slice(start, index).trim();
    if (part) {
      parts.push(part);
    }
    start = index + 1;
  }

  return parts;
}

/** Etkinlik listesinde/haritasında adres yokken gösterilen yer tutucu. */
export function noLocationLabel(): string {
  return i18n.t("events:fallback.noLocation");
}

/** Açıklama girilmemişken gösterilen yer tutucu metin. */
export function noDescriptionLabel(): string {
  return i18n.t("events:fallback.noDescription");
}

function shortLocation(address: string): string {
  const trimmed = typeof address === "string" ? address.trim() : "";
  if (!trimmed) {
    return noLocationLabel();
  }

  // Hermes on physical iOS devices can crash inside String.prototype.split
  // for this regex path. Scan the two separators without invoking split.
  const parts = addressParts(trimmed);
  const useful = parts.filter(
    (part) => !isPostcode(part) && !isCountryOrRegion(part),
  );

  if (useful.length === 0) {
    return noLocationLabel();
  }

  const districts = useful.filter(
    (part) => !isMajorCity(part) && !isStreet(part),
  );
  const raw =
    (districts.length > 1 ? districts[districts.length - 1] : districts[0]) ??
    useful.find((part) => !isStreet(part)) ??
    useful[0];

  return shortenPlaceName(raw) || noLocationLabel();
}

export function parseFeeAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function formatTryAmount(amount: number): string {
  return `${new Intl.NumberFormat(currentDateLocale(), {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)} ₺`;
}

export function formatEventFee(
  isPaid: boolean,
  feeAmount: number | null | undefined,
): string {
  if (!isPaid || feeAmount == null) {
    return i18n.t("events:fee.free");
  }

  return formatTryAmount(feeAmount);
}

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
    skillLevel: item.skillLevel ?? null,
    isPaid: item.isPaid === true,
    feeAmount: item.feeAmount ?? null,
    hostName: item.organizerUsername
      ? `@${item.organizerUsername}`
      : i18n.t("events:fallback.organizer"),
    status: item.status,
    durationMinutes: item.durationMinutes,
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

export function mapParticipant(participant: ApiParticipant): EventParticipant {
  const isGuest = participant.isGuest || participant.kind === 1;
  const guestName = [participant.firstName, participant.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

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

export function mapExplorePerson(item: ApiExplorePerson): ExplorePerson {
  return {
    userId: item.userId,
    username: item.username,
    firstName: item.firstName,
    name: formatPersonName(item),
    avatarUrl: item.profileImageUrl,
    city: item.city,
    mutualFriendsCount: item.mutualFriendsCount,
    sharedSportsCount: item.sharedSportsCount,
    sameCity: item.sameCity,
    sharedSportNames: item.sharedSportNames ?? [],
  };
}

export function eventStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return i18n.t("events:status.draft");
    case 1:
      return i18n.t("events:status.published");
    case 2:
      return i18n.t("events:status.full");
    case 3:
      return i18n.t("events:status.completed");
    case 4:
      return i18n.t("events:status.cancelled");
    default:
      return i18n.t("events:fallback.event");
  }
}

export function participantStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return i18n.t("events:participantStatus.pending");
    case 1:
      return i18n.t("events:participantStatus.approved");
    case 2:
      return i18n.t("events:participantStatus.rejected");
    case 3:
      return i18n.t("events:participantStatus.left");
    case 4:
      return i18n.t("events:participantStatus.attended");
    case 5:
      return i18n.t("events:participantStatus.noShow");
    case 6:
      return i18n.t("events:participantStatus.invited");
    default:
      return "";
  }
}

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
