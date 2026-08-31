export type ApiFriend = {
  friendshipId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  friendsSince: string;
};

export type ApiBlockedUser = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
};

export type ApiFriendship = {
  id: string;
  requesterUserId: string;
  requesterUsername: string | null;
  requesterFirstName: string | null;
  requesterProfileImageUrl: string | null;
  addresseeUserId: string;
  addresseeUsername: string | null;
  addresseeFirstName: string | null;
  addresseeProfileImageUrl: string | null;
  status: number;
  createdAt: string;
};

export const FRIENDSHIP_STATUS = {
  pending: 0,
  accepted: 1,
  rejected: 2,
  blocked: 3,
} as const;

export type ApiFriendSuggestion = {
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  city: string | null;
  mutualFriendsCount: number;
  sharedSportsCount: number;
  sharedSportNames: string[];
};

export const POST_MEDIA_TYPE = {
  image: 0,
  video: 1,
} as const;

export type ApiPostMedia = {
  id: string;
  mediaType: number;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  displayOrder: number;
};

export type ApiPost = {
  id: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  content: string | null;
  likeCount: number;
  commentCount: number;
  mediaCount: number;
  likedByMe: boolean;
  createdAt: string;
  media: ApiPostMedia[];
};

export type ApiComment = {
  id: string;
  postId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  parentCommentId: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
};

export type ApiBadge = {
  id: string;
  badgeId?: string;
  code: string;
  name: string;
  description: string;
  iconPath: string;
  earnedAt?: string;
  isShowcased?: boolean;
  earned?: boolean;
  current?: number;
  target?: number;
  percent?: number;
};

export type ApiQuest = {
  id: string;
  code: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  percent: number;
  status: number | null;
  completedAt: string | null;
};

export type ApiAlbum = {
  id: string;
  title: string;
  description: string | null;
  mediaCount: number;
  kind: number;
  visibility: number;
  createdAt: string;
};

export type ApiAlbumDetail = ApiAlbum & {
  media: Array<{
    id: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
  }>;
};

export type ApiReportReason = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};
