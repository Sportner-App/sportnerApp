import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  AuthActionResult,
  AuthCredentials,
  AuthResult,
  AuthUser,
  AuthenticationResponse,
  RegisterPayload,
  SessionResult,
} from "@/types/auth";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function toAuthUser(
  response: AuthenticationResponse,
  username: string,
  names?: { firstName?: string; lastName?: string },
): AuthUser {
  const firstName = names?.firstName?.trim();
  const lastName = names?.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || undefined;

  return {
    id: response.userId,
    username,
    firstName,
    lastName,
    fullName,
    isNewUser: response.isNewUser,
    isOnboarded: response.isOnboardingCompleted,
  };
}

function validateUsername(username: string, forRegister: boolean): string | null {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return "Kullanıcı adı gerekli.";
  }

  if (normalized.length > 30) {
    return "Kullanıcı adı en fazla 30 karakter olabilir.";
  }

  if (forRegister) {
    if (normalized.length < 3) {
      return "Kullanıcı adı en az 3 karakter olmalı.";
    }

    if (!USERNAME_PATTERN.test(normalized)) {
      return "Kullanıcı adı yalnızca harf, rakam, . ve _ içerebilir.";
    }
  }

  return null;
}

function validatePassword(password: string, forRegister: boolean): string | null {
  if (!password) {
    return "Şifre gerekli.";
  }

  if (password.length > 128) {
    return "Şifre çok uzun.";
  }

  if (forRegister && password.length < 8) {
    return "Şifre en az 8 karakter olmalı.";
  }

  return null;
}

async function persistAuthSession(
  body: AuthenticationResponse,
  username: string,
  names?: { firstName?: string; lastName?: string },
): Promise<AuthResult> {
  if (!body?.accessToken || !body?.userId || !body?.refreshToken) {
    throw new Error("API geçersiz response döndü: token veya userId eksik");
  }

  const user = toAuthUser(body, username, names);

  await apiClient.setSession({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    user,
  });

  return {
    data: {
      user,
      session: {
        access_token: body.accessToken,
        refresh_token: body.refreshToken,
      },
      isNewUser: body.isNewUser,
      isOnboardingCompleted: body.isOnboardingCompleted,
    },
    error: null,
  };
}

/**
 * POST /api/auth/login
 */
export async function login({
  username,
  password,
}: AuthCredentials): Promise<AuthResult> {
  const normalized = normalizeUsername(username);
  const usernameError = validateUsername(username, false);
  const passwordError = validatePassword(password, false);

  if (usernameError || passwordError) {
    return {
      data: null,
      error: { message: usernameError || passwordError || "Geçersiz bilgiler." },
    };
  }

  try {
    const response = await apiClient.post<AuthenticationResponse>(
      "/api/auth/login",
      {
        username: normalized,
        password,
      },
    );

    return persistAuthSession(response.data, normalized);
  } catch (error) {
    return {
      data: null,
      error: { message: getApiErrorMessage(error, "Giriş başarısız") },
    };
  }
}

/**
 * POST /api/auth/register
 */
export async function register({
  username,
  password,
  firstName,
  lastName,
}: RegisterPayload): Promise<AuthResult> {
  const normalized = normalizeUsername(username);
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName?.trim() || undefined;

  const usernameError = validateUsername(username, true);
  const passwordError = validatePassword(password, true);

  if (usernameError || passwordError) {
    return {
      data: null,
      error: { message: usernameError || passwordError || "Geçersiz bilgiler." },
    };
  }

  if (!trimmedFirstName) {
    return {
      data: null,
      error: { message: "Ad gerekli." },
    };
  }

  if (trimmedFirstName.length > 50) {
    return {
      data: null,
      error: { message: "Ad en fazla 50 karakter olabilir." },
    };
  }

  if (trimmedLastName && trimmedLastName.length > 50) {
    return {
      data: null,
      error: { message: "Soyad en fazla 50 karakter olabilir." },
    };
  }

  try {
    const response = await apiClient.post<AuthenticationResponse>(
      "/api/auth/register",
      {
        username: normalized,
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName ?? null,
      },
    );

    return persistAuthSession(response.data, normalized, {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
    });
  } catch (error) {
    return {
      data: null,
      error: { message: getApiErrorMessage(error, "Kayıt başarısız") },
    };
  }
}

/**
 * POST /api/auth/logout — revokes refresh session, then clears local storage.
 */
export async function signOut(): Promise<AuthActionResult> {
  try {
    const refreshToken = await apiClient.getRefreshToken();

    if (refreshToken) {
      try {
        await apiClient.post("/api/auth/logout", { refreshToken });
      } catch {
        // Idempotent: still clear local session if server revoke fails.
      }
    }

    await apiClient.clearToken();
    return { error: null };
  } catch (error) {
    return {
      error: { message: getApiErrorMessage(error, "Logout başarısız") },
    };
  }
}

export async function getSession(): Promise<SessionResult> {
  try {
    const token = await apiClient.getToken();
    const refreshToken = await apiClient.getRefreshToken();
    const user = await apiClient.getUser();

    if (token && user) {
      return {
        data: {
          session: {
            access_token: token,
            refresh_token: refreshToken ?? undefined,
            user,
          },
        },
        error: null,
      };
    }

    return { data: { session: null }, error: null };
  } catch (error) {
    console.error("Session check error:", error);
    return { data: { session: null }, error: null };
  }
}

/**
 * POST /api/auth/refresh — yalnızca access token geçersizken (401) kullanılır.
 * Boot'ta çağrılmaz; api client interceptor üzerinden gider.
 */
export async function syncSessionFromRefresh(): Promise<boolean> {
  return apiClient.refreshSession();
}
