import type { EventFeedItem } from "@/entities/event";

export type ParticipantStatus = "pending" | "approved" | "rejected";

export type ParticipantProfile = {
  userId: string;
  requestId: string;
  status: ParticipantStatus;
  fullName: string;
  avatarUrl: string | null;
  skillLevel: string | null;
};

export type CreatorProfile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type EventDetailData = {
  event: EventFeedItem;
  creator: CreatorProfile | null;
  allParticipants: ParticipantProfile[];
  approvedParticipants: ParticipantProfile[];
  pendingParticipants: ParticipantProfile[];
};
