export type SessionUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
  [key: string]: unknown;
};

export type SessionData = {
  access_token: string;
  refresh_token?: string;
  user?: SessionUser;
};

export type SessionContextValue = {
  isConfigured: boolean;
  isReady: boolean;
  session: SessionData | null;
  user: SessionUser | null;
  refreshSession?: () => Promise<void>;
};
