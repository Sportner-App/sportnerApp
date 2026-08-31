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

export type ApiConversation = {
  id: string;
  type: number;
  eventId: string | null;
  title: string | null;
  isClosed: boolean;
  myRole: number;
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
