export type ApiReview = {
  id: string;
  eventId: string;
  reviewerUserId: string;
  reviewerUsername: string | null;
  reviewerFirstName: string | null;
  reviewedUserId: string;
  reviewedUsername: string | null;
  reviewedFirstName: string | null;
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
};