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
  replyToUserId?: string | null;
  replyToUsername?: string | null;
};
