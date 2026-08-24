export type ApiFriend = {
  friendshipId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  friendsSince: string;
};

export type ApiFriendship = {
  id: string;
  requesterUserId: string;
  requesterUsername: string | null;
  requesterFirstName: string | null;
  addresseeUserId: string;
  addresseeUsername: string | null;
  addresseeFirstName: string | null;
  status: number;
  createdAt: string;
};

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

export type ApiPost = {
  id: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  content: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
};

export type ApiComment = {
  id: string;
  postId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
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
