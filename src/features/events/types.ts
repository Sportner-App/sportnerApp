import type { PageSummary } from "@/types/api";
import type { IconName } from "@/types/components";

/** API: ParticipantAvatarResponse — small preview stack on list cards */
export type ApiParticipantAvatar = {
  userId: string | null;
  name: string | null;
  profileImageUrl: string | null;
  isGuest: boolean;
};

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
  /** null: süre belirtilmemiş. */
  durationMinutes: number | null;
  latitude: number;
  longitude: number;
  address: string;
  maxParticipants: number | null;
  minParticipantAge: number | null;
  maxParticipantAge: number | null;
  participantGender: number | null;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  status: number;
  occupiedParticipantCount: number;
  participantAvatars: ApiParticipantAvatar[] | null;
  myParticipationStatus: number | null;
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
  /** null: süre belirtilmemiş. */
  durationMinutes: number | null;
  latitude: number;
  longitude: number;
  address: string;
  maxParticipants: number | null;
  minParticipantAge: number | null;
  maxParticipantAge: number | null;
  participantGender: number | null;
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

export type ParticipantAvatarPreview = {
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  isGuest: boolean;
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
  participantAvatars: ParticipantAvatarPreview[];
  maxParticipants: number | null;
  minParticipantAge: number | null;
  maxParticipantAge: number | null;
  participantGender: number | null;
  skillLevel: number | null;
  isPaid: boolean;
  feeAmount: number | null;
  hostName: string;
  status: number;
  /** null: süre belirtilmemiş. */
  durationMinutes: number | null;
  myParticipationStatus: number | null;
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
  email: string;
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
  /** `code` is the backend error code (e.g. `Event.ParticipantBirthDateMissing`). */
  error: { message: string; code?: string } | null;
  data?: T;
};

/** API: PendingAttendanceParticipantResponse */
export type ApiPendingAttendanceParticipant = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
};

/** API: PendingAttendanceEventResponse — GET /api/events/mine/pending-attendance */
export type ApiPendingAttendanceEvent = {
  eventId: string;
  title: string;
  eventDate: string;
  participants: ApiPendingAttendanceParticipant[];
};

export type PendingAttendanceParticipant = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

export type PendingAttendanceEvent = {
  eventId: string;
  title: string;
  eventDate: string;
  participants: PendingAttendanceParticipant[];
};

/** API: PendingJoinRequestEventResponse — GET /api/events/mine/pending-requests */
export type ApiPendingJoinRequestEvent = {
  eventId: string;
  title: string;
  eventDate: string;
  pendingCount: number;
  applicants: ApiPendingAttendanceParticipant[];
};

export type PendingJoinRequestEvent = {
  eventId: string;
  title: string;
  eventDate: string;
  pendingCount: number;
  applicants: PendingAttendanceParticipant[];
};

export type EventListPage = PageSummary<EventSummary>;

/** POST /api/events */
export type CreateEventPayload = {
  title: string;
  description: string;
  sportId: string;
  /** ISO 8601 */
  eventDate: string;
  /** null: süre belirtilmemiş. */
  durationMinutes: number | null;
  /** null: sınırsız kontenjan. */
  maxParticipants: number | null;
  minParticipantAge: number | null;
  maxParticipantAge: number | null;
  participantGender: number | null;
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
  /** null: süre belirtilmemiş. */
  durationMinutes: number | null;
  maxPlayers: string;
  /** Sınırsız kontenjan: maxPlayers yok sayılır, API'ye null gider. */
  isUnlimitedPlayers: boolean;
  /** Off by default: events are open to all ages unless the organizer opts in. */
  hasAgeRestriction: boolean;
  minParticipantAge: string;
  maxParticipantAge: string;
  participantGender: number | null;
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
  sportCategoryId?: string;
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

export type ExploreEventItem = EventSummary & {
  distanceKm: number | null;
  friendsAttending: number;
  sportMatch: boolean;
};

export const EVENT_QNA_ROLE = {
  visitor: 0,
  participant: 1,
  organizer: 2,
} as const;

/** Soruda etiketlenen kullanıcı; metindeki "@ad" bununla kimliğe bağlanır. */
export type EventQuestionMention = {
  userId: string;
  username: string;
};

export type ApiEventQuestion = {
  id: string;
  eventId: string;
  authorUserId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  parentId: string | null;
  replyToUserId: string | null;
  replyToUsername: string | null;
  content: string;
  replyCount: number;
  authorRole: number;
  createdAt: string;
  replies: ApiEventQuestion[];
  mentions: EventQuestionMention[];
};

export type ApiReview = {
  id: string;
  eventId: string;
  reviewerUserId: string;
  reviewerUsername: string | null;
  reviewerFirstName: string | null;
  reviewerProfileImageUrl: string | null;
  reviewedUserId: string;
  reviewedUsername: string | null;
  reviewedFirstName: string | null;
  reviewedProfileImageUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ApiReviewablePeer = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  /** The event owner is deliberately called out first in the feedback flow. */
  isOrganizer: boolean;
};
