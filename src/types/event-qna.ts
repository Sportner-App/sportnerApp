export const EVENT_QNA_ROLE = {
  visitor: 0,
  participant: 1,
  organizer: 2,
} as const;

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
};
