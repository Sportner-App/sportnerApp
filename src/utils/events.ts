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
  type ApiWaitlistEntry,
  type EventDetail,
  type EventParticipant,
  type EventSummary,
  type EventWaitlistEntry,
  type ExploreEventItem,
  type ExplorePerson,
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
};

const WEEKDAY_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] as const;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sportIconForSlug(slug: string): IconName {
  return SPORT_ICON_BY_SLUG[slug.toLowerCase()] ?? "shapes";
}

export function formatEventTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    return "BUGÜN";
  }

  if (dayDiff === 1) {
    return "YARIN";
  }

  if (dayDiff >= 2 && dayDiff <= 6) {
    return `${dayDiff} GÜN SONRA`;
  }

  return null;
}

export function formatEventDateLabel(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) {
    return `Bugün · ${time}`;
  }

  if (dayDiff === 1) {
    return `Yarın · ${time}`;
  }

  if (dayDiff > 1 && dayDiff < 7) {
    return `${WEEKDAY_TR[date.getDay()]} · ${time}`;
  }

  const dayMonth = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });

  return `${dayMonth} · ${time}`;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return `${hours} sa`;
  }

  return `${hours} sa ${rest} dk`;
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

  return "Sporcu";
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

function shortLocation(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) {
    return "Konum yok";
  }

  const parts = trimmed
    .split(/[,/]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const useful = parts.filter(
    (part) => !isPostcode(part) && !isCountryOrRegion(part),
  );

  if (useful.length === 0) {
    return "Konum yok";
  }

  const districts = useful.filter(
    (part) => !isMajorCity(part) && !isStreet(part),
  );
  const raw =
    (districts.length > 1 ? districts[districts.length - 1] : districts[0]) ??
    useful.find((part) => !isStreet(part)) ??
    useful[0];

  return shortenPlaceName(raw) || "Konum yok";
}

export function mapListItemToSummary(item: ApiEventListItem): EventSummary {
  return {
    id: item.id,
    title: item.title,
    sportId: item.sportId,
    sport: item.sportSlug,
    sportName: item.sportName,
    sportIcon: sportIconForSlug(item.sportSlug),
    dateLabel: formatEventDateLabel(item.eventDate),
    eventDate: item.eventDate,
    location: shortLocation(item.address),
    participantCount: item.occupiedParticipantCount,
    maxParticipants: item.maxParticipants,
    hostName: item.organizerUsername
      ? `@${item.organizerUsername}`
      : "Organizatör",
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
    dateLabel: formatEventDateLabel(detail.eventDate),
    eventDate: detail.eventDate,
    location: shortLocation(detail.address),
    participantCount: detail.occupiedParticipantCount,
    maxParticipants: detail.maxParticipants,
    hostName: formatPersonName(organizer),
    status: detail.status,
    durationMinutes: detail.durationMinutes,
    description: detail.description?.trim() || "Açıklama eklenmemiş.",
    address: detail.address,
    latitude: Number(detail.latitude),
    longitude: Number(detail.longitude),
    durationLabel: formatDurationLabel(detail.durationMinutes),
    participants: participants.map(mapParticipant),
    waitlist: [],
    myParticipationStatus: detail.myParticipationStatus,
    isOnWaitlist: detail.isOnWaitlist,
    waitlistCount: detail.waitlistCount,
    conversationId: detail.conversationId,
    organizerUserId: organizer.userId,
  };
}

export function mapParticipant(participant: ApiParticipant): EventParticipant {
  return {
    id: participant.userId,
    name: formatPersonName(participant),
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
      return "Taslak";
    case 1:
      return "Yayında";
    case 2:
      return "Dolu";
    case 3:
      return "Tamamlandı";
    case 4:
      return "İptal";
    default:
      return "Etkinlik";
  }
}

export function participantStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return "Onay bekliyor";
    case 1:
      return "Onaylandı";
    case 2:
      return "Reddedildi";
    case 3:
      return "Ayrıldı";
    case 4:
      return "Katıldı";
    case 5:
      return "Gelmedi";
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
    status === PARTICIPANT_STATUS.approved ||
    status === PARTICIPANT_STATUS.attended
  );
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
  eventStatus: number,
): boolean {
  if (!conversationId) {
    return false;
  }

  if (
    eventStatus === EVENT_STATUS.cancelled ||
    eventStatus === EVENT_STATUS.completed
  ) {
    return false;
  }

  return isOrganizer || hasApprovedParticipation(status);
}
