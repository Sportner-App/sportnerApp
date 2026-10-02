export const CONVERSATION_TYPE = {
  event: 0,
  direct: 1,
  group: 2,
} as const;

export type ConversationType =
  (typeof CONVERSATION_TYPE)[keyof typeof CONVERSATION_TYPE];

export type ApiConversationMember = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  role: number;
  joinedAt: string;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderUsername: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderProfileImageUrl: string | null;
  messageType: number;
  content: string | null;
  mediaUrl: string | null;
  mediaSize: number | null;
  mediaMimeType: string | null;
  replyToMessageId: string | null;
  editedAt: string | null;
  isRedacted: boolean;
  createdAt: string;
};

export type MessageDeliveryStatus = "sending" | "failed";

/**
 * Sohbet listesinde gösterilen mesaj. Sunucuya henüz yazılmamış iyimser
 * baloncuklar da bu tiple taşınır: `pendingId` doluysa mesaj yereldir.
 */
export type ChatMessage = ApiMessage & {
  /** Yalnızca sunucu yanıtı beklenen yerel baloncuklarda dolu. */
  pendingId?: string;
  status?: MessageDeliveryStatus;
};

export type ApiConversation = {
  id: string;
  type: number;
  eventId: string | null;
  title: string | null;
  isClosed: boolean;
  myRole: number;
  members?: ApiConversationMember[];
};

export type ApiConversationListItem = {
  id: string;
  type: number;
  eventId: string | null;
  title: string | null;
  isClosed: boolean;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isMuted: boolean;
  isFriend: boolean | null;
  peerUserId: string | null;
  peerUsername: string | null;
  peerFirstName: string | null;
  peerProfileImageUrl: string | null;
};
