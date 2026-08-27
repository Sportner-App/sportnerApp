export type ApiDiscoverUser = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  city: string | null;
};

export type DiscoverUser = {
  userId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  city: string | null;
};

export type PagedUsers = {
  items: DiscoverUser[];
  page: number;
  totalCount: number;
  hasNext: boolean;
};
