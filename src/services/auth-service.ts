import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";

import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { clearCurrentDevicePushToken } from "@/services/push-notifications-service";
import { getMyProfile } from "@/services/profile-service";
import type {
  AuthActionResult,
  AuthCredentials,
  AuthResult,
  AuthUser,
  AuthenticationResponse,
  CompleteExternalRegistrationPayload,
  ExternalAuthResult,
  ExternalSignInResponse,
  RegisterPayload,
  SessionResult,
} from "@/types/auth";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function toAuthUser(
  response: AuthenticationResponse,
  username?: string,
  names?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  },
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
    email: names?.email,
    avatarUrl: names?.avatarUrl,
    isNewUser: response.isNewUser,
    isOnboarded: response.isOnboardingCompleted,
  };
}

function validateUsername(
  username: string,
  forRegister: boolean,
): string | null {
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

function validatePassword(
  password: string,
  forRegister: boolean,
): string | null {
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

async function persistExternalAuthSession(
  body: AuthenticationResponse,
  hints?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  },
): Promise<AuthResult> {
  if (!body?.accessToken || !body?.userId || !body?.refreshToken) {
    throw new Error("API geçersiz response döndü: token veya userId eksik");
  }

  const user = toAuthUser(body, undefined, hints);

  await apiClient.setSession({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    user,
  });

  // Social auth responses do not carry profile fields. A profile exists both after external
  // registration and for returning users, even while sports onboarding is still incomplete.
  try {
    const profile = await getMyProfile();
    const mergedUser: AuthUser = {
      ...user,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName ?? undefined,
      fullName:
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
        undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
    await apiClient.setUser(mergedUser);

    return {
      data: {
        user: mergedUser,
        session: {
          access_token: body.accessToken,
          refresh_token: body.refreshToken,
        },
        isNewUser: body.isNewUser,
        isOnboardingCompleted: body.isOnboardingCompleted,
      },
      error: null,
    };
  } catch {
    // Best-effort compatibility for legacy profile-less accounts.
  }

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

function toExternalRegistration(body: ExternalSignInResponse) {
  if (
    !body.registrationToken ||
    !body.registrationTokenExpiresAt ||
    !body.suggestedUsername
  ) {
    throw new Error("API geçersiz sosyal kayıt bilgisi döndürdü.");
  }

  return {
    registrationToken: body.registrationToken,
    registrationTokenExpiresAt: body.registrationTokenExpiresAt,
    suggestedUsername: body.suggestedUsername,
    firstName: body.firstName ?? undefined,
    lastName: body.lastName ?? undefined,
    email: body.email ?? undefined,
    profileImageUrl: body.profileImageUrl ?? undefined,
  };
}

async function handleExternalSignInResponse(
  body: ExternalSignInResponse,
): Promise<ExternalAuthResult> {
  if (body.requiresRegistration) {
    return {
      data: null,
      registration: toExternalRegistration(body),
      error: null,
    };
  }

  if (!body.authentication) {
    throw new Error("API geçersiz sosyal giriş cevabı döndürdü.");
  }

  const result = await persistExternalAuthSession(body.authentication);
  return result.error
    ? { data: null, registration: null, error: result.error }
    : { data: result.data, registration: null, error: null };
}

let isGoogleSignInConfigured = false;

type GoogleSignInModule =
  typeof import("@react-native-google-signin/google-signin");

function loadGoogleSignInModule(): GoogleSignInModule {
  try {
    // Keep this native dependency lazy: Expo Go or an outdated development binary must
    // not crash the entire application before the user even taps Google sign-in.
    return require("@react-native-google-signin/google-signin") as GoogleSignInModule;
  } catch {
    throw new Error(
      "Google ile giriş bu uygulama sürümünde bulunmuyor. Native uygulamayı yeniden derleyip yükle.",
    );
  }
}

function ensureGoogleSignInConfigured(
  GoogleSignin: GoogleSignInModule["GoogleSignin"],
) {
  if (isGoogleSignInConfigured) {
    return;
  }

  const auth = Constants.expoConfig?.extra?.auth as
    { googleWebClientId?: string; googleIosClientId?: string } | undefined;

  GoogleSignin.configure({
    webClientId: auth?.googleWebClientId,
    iosClientId: auth?.googleIosClientId,
  });
  isGoogleSignInConfigured = true;
}

/**
 * Native Google sign-in → POST /api/auth/google.
 * Returns null when the user cancels (not an error — nothing to show).
 */
export async function signInWithGoogle(): Promise<ExternalAuthResult | null> {
  try {
    const { GoogleSignin, isSuccessResponse } = loadGoogleSignInModule();
    ensureGoogleSignInConfigured(GoogleSignin);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null;
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return {
        data: null,
        registration: null,
        error: { message: "Google kimlik bilgisi alınamadı." },
      };
    }

    const apiResponse = await apiClient.post<ExternalSignInResponse>(
      "/api/auth/google",
      { idToken },
    );

    return handleExternalSignInResponse(apiResponse.data);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "SIGN_IN_CANCELLED"
    ) {
      return null;
    }

    return {
      data: null,
      registration: null,
      error: {
        message: getApiErrorMessage(error, "Google ile giriş başarısız"),
      },
    };
  }
}

/**
 * Native Apple sign-in → POST /api/auth/apple.
 * Returns null when the user cancels (not an error — nothing to show).
 */
export async function signInWithApple(): Promise<ExternalAuthResult | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        data: null,
        registration: null,
        error: { message: "Apple kimlik bilgisi alınamadı." },
      };
    }

    const apiResponse = await apiClient.post<ExternalSignInResponse>(
      "/api/auth/apple",
      {
        identityToken: credential.identityToken,
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
      },
    );

    return handleExternalSignInResponse(apiResponse.data);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ERR_REQUEST_CANCELED"
    ) {
      return null;
    }

    return {
      data: null,
      registration: null,
      error: {
        message: getApiErrorMessage(error, "Apple ile giriş başarısız"),
      },
    };
  }
}

export async function completeExternalRegistration(
  payload: CompleteExternalRegistrationPayload,
): Promise<AuthResult> {
  try {
    const response = await apiClient.post<AuthenticationResponse>(
      "/api/auth/external/complete",
      {
        registrationToken: payload.registrationToken,
        username: normalizeUsername(payload.username),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName?.trim() || null,
        birthDate: payload.birthDate,
        gender: payload.gender ?? 0,
      },
    );

    return persistExternalAuthSession(response.data, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatarUrl: payload.profileImageUrl,
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: getApiErrorMessage(error, "Sosyal kayıt tamamlanamadı"),
      },
    };
  }
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
      error: {
        message: usernameError || passwordError || "Geçersiz bilgiler.",
      },
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
  gender,
  birthDate,
}: RegisterPayload): Promise<AuthResult> {
  const normalized = normalizeUsername(username);
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName?.trim() || undefined;

  const usernameError = validateUsername(username, true);
  const passwordError = validatePassword(password, true);

  if (usernameError || passwordError) {
    return {
      data: null,
      error: {
        message: usernameError || passwordError || "Geçersiz bilgiler.",
      },
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

  if (!Number.isInteger(gender) || gender < 0 || gender > 2) {
    return {
      data: null,
      error: { message: "Geçerli bir cinsiyet seçmelisin." },
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return {
      data: null,
      error: { message: "Geçerli bir doğum tarihi girmelisin." },
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
        gender,
        birthDate,
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
    await clearCurrentDevicePushToken().catch((error) => {
      console.warn("Push token kaldırılamadı:", error);
    });

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
