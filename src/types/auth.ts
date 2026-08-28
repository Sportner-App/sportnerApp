import type { SessionData, SessionUser } from "./session";

export type AuthUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  isOnboarded?: boolean;
  isNewUser?: boolean;
  pushToken?: string;
  sports?: string[];
  skillLevels?: Record<string, string>;
  [key: string]: unknown;
};

/** POST /api/auth/login | register response */
export type AuthenticationResponse = {
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  isNewUser: boolean;
  isOnboardingCompleted: boolean;
};

export type AuthError = {
  message: string;
};

export type AuthCredentials = {
  username: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  firstName: string;
  lastName?: string;
  gender: number;
  birthDate: string;
};

export type AuthSession = {
  user: AuthUser;
  session: {
    access_token: string;
    refresh_token: string;
  };
  isNewUser: boolean;
  isOnboardingCompleted: boolean;
};

export type AuthResult =
  { data: AuthSession; error: null } | { data: null; error: AuthError };

export type StoredSession = {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
};

export type SessionResult = {
  data: { session: StoredSession | null };
  error: null;
};

export type AuthActionResult = {
  error: AuthError | null;
};

export type AuthActions = {
  login: (payload: AuthCredentials) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  signOut: () => Promise<AuthActionResult>;
};

export type AuthContextValue = AuthActions & {
  isConfigured: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  session: SessionData | null;
  user: SessionUser | null;
  userId: string | null;
  userEmail: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export type AuthMode = "login" | "register";
