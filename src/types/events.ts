import type { IconName } from "./components";

/** API: EventListItemResponse */
export type ApiEventListItem = {
  id: string;
  sportId: string;
  sportName: string;
  sportSlug: string;
  sportCoverImageUrl: string | null;
  organizerUserId: string;
  organizerUsername: string | null;
  title: string;
  eventDate: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  address: string;
  maxParticipants: number | null;
  minParticipantAge: number;
  maxParticipantAge: number;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  status: number;
  occupiedParticipantCount: number;
};

/** API: OrganizerSnippetResponse */
export type ApiOrganizerSnippet = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

/** API: EventResponse */
export type ApiEventDetail = {
  id: string;
  sportId: string;
  sportName: string;
  sportSlug: string;
  sportCoverImageUrl: string | null;
  organizer: ApiOrganizerSnippet;
  title: string;
  description: string | null;
  eventDate: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  address: string;
  maxParticipants: number | null;
  minParticipantAge: number;
  maxParticipantAge: number;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  status: number;
  occupiedParticipantCount: number;
  waitlistCount: number;
  myParticipationStatus: number | null;
  isOnWaitlist: boolean;
  conversationId: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  canCancel?: boolean;
};

/** API: ParticipantResponse */
export type ApiParticipant = {
  id: string;
  userId: string | null;
  kind: 0 | 1;
  isGuest: boolean;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  status: number;
  joinedAt: string | null;
  attendedAt: string | null;
  canReview: boolean;
};

/** API: WaitlistEntryResponse */
export type ApiWaitlistEntry = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  position: number;
  createdAt: string;
};

export const EVENT_STATUS = {
  draft: 0,
  published: 1,
  full: 2,
  completed: 3,
  cancelled: 4,
} as const;

export const PARTICIPANT_STATUS = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
  attended: 4,
  noShow: 5,
  invited: 6,
} as const;

/** API: ApplyToEventResponse */
export type ApiApplyToEventResponse = {
  joinedWaitlist: boolean;
  participantStatus: number | null;
  waitlistPosition: number | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type EventSummary = {
  id: string;
  title: string;
  sportId: string;
  sport: string;
  sportName: string;
  sportIcon: IconName;
  sportCoverImageUrl: string | null;
  latitude: number;
  longitude: number;
  dateLabel: string;
  eventDate: string;
  location: string;
  participantCount: number;
  maxParticipants: number | null;
  minParticipantAge: number;
  maxParticipantAge: number;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  hostName: string;
  status: number;
  durationMinutes: number;
};

export type EventParticipant = {
  id: string;
  userId: string | null;
  kind: 0 | 1;
  isGuest: boolean;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  status: number;
  canReview: boolean;
};

export type EventGuestAssignment = {
  firstName: string;
  lastName: string;
};

export type EventParticipantAssignment = {
  guests?: EventGuestAssignment[];
  friendUserIds?: string[];
};

export type EventWaitlistEntry = {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  position: number;
};

export type EventDetail = EventSummary & {
  description: string;
  address: string;
  durationLabel: string;
  participants: EventParticipant[];
  waitlist: EventWaitlistEntry[];
  myParticipationStatus: number | null;
  isOnWaitlist: boolean;
  waitlistCount: number;
  conversationId: string | null;
  organizerUserId: string;
  organizationId?: string | null;
  organizationName?: string | null;
  canCancel?: boolean;
};

export type EventActionResult<T = ApiApplyToEventResponse | null> = {
  error: { message: string } | null;
  data?: T;
};

export type EventListPage = {
  items: EventSummary[];
  totalCount: number;
  page: number;
  hasNext: boolean;
};

/** POST /api/events */
export type CreateEventPayload = {
  title: string;
  description: string;
  sportId: string;
  /** ISO 8601 */
  eventDate: string;
  durationMinutes: number;
  maxParticipants: number;
  minParticipantAge: number;
  maxParticipantAge: number;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  address: string;
  latitude: number;
  longitude: number;
  recurrenceIntervalWeeks?: 1 | 2 | 4;
  recurrenceCount?: number;
  organizationId?: string;
};

export type CreateEventResult = {
  data: { id: string; ids?: string[]; published: boolean } | null;
  error: { message: string } | null;
};

export type CreateEventFormValues = {
  title: string;
  description: string;
  sportSlug: string;
  eventDate: Date;
  durationMinutes: number;
  maxPlayers: string;
  minParticipantAge: string;
  maxParticipantAge: string;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmountText: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  isRecurring: boolean;
  recurrenceIntervalWeeks: 1 | 2 | 4;
  recurrenceCount: number;
};

export type DiscoverEventsParams = {
  sportId?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minAge?: number;
  maxAge?: number;
  gender?: number;
  skillLevel?: number;
  isPaid?: boolean;
  friendsOnly?: boolean;
  organizationsOnly?: boolean;
  organizationId?: string;
  page?: number;
  pageSize?: number;
};

/** API: ExploreEventItemResponse */
export type ApiExploreEventItem = ApiEventListItem & {
  distanceKm: number | null;
  friendsAttending: number;
  sportMatch: boolean;
};

/** API: ExplorePersonItemResponse */
export type ApiExplorePerson = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sameCity: boolean;
  sharedSportNames: string[];
};

export type ExploreEventItem = EventSummary & {
  distanceKm: number | null;
  friendsAttending: number;
  sportMatch: boolean;
};

export type ExplorePerson = {
  userId: string;
  username: string | null;
  firstName: string | null;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sameCity: boolean;
  sharedSportNames: string[];
};
