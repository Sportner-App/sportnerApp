import { PERSON_NAME_MAX_LENGTH } from "@/constants/validation";
import type {
  AuthActionResult,
  AuthCredentials,
  AuthenticationResponse,
  AuthResult,
  RegisterPayload,
  SessionResult,
} from "@/features/auth/types";
import {
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/features/auth/validation";
import { clearCurrentDevicePushToken } from "@/features/notifications/services/push-notifications-service";
import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";

import { persistAuthSession, toErrorMessage } from "./session-store";

export {
  completeExternalRegistration,
  signInWithApple,
  signInWithGoogle,
} from "./social-auth-service";

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
        message:
          usernameError ||
          passwordError ||
          i18n.t("auth:service.invalidCredentials"),
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
      error: toErrorMessage(error, "auth:service.loginFailed"),
    };
  }
}

/**
 * POST /api/auth/register
 */
export async function register({
  username,
  password,
  email,
  firstName,
  lastName,
  gender,
  birthDate,
}: RegisterPayload): Promise<AuthResult> {
  const normalized = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName?.trim() || undefined;

  const usernameError = validateUsername(username, true);
  const passwordError = validatePassword(password, true);
  const emailError = validateEmail(normalizedEmail);

  if (usernameError || passwordError || emailError) {
    return {
      data: null,
      error: {
        message:
          usernameError ||
          passwordError ||
          emailError ||
          i18n.t("auth:service.invalidCredentials"),
      },
    };
  }

  if (!trimmedFirstName) {
    return {
      data: null,
      error: { message: i18n.t("auth:validation.firstNameRequired") },
    };
  }

  if (trimmedFirstName.length > PERSON_NAME_MAX_LENGTH) {
    return {
      data: null,
      error: {
        message: i18n.t("auth:validation.firstNameTooLong", {
          max: PERSON_NAME_MAX_LENGTH,
        }),
      },
    };
  }

  if (!trimmedLastName) {
    return {
      data: null,
      error: { message: i18n.t("auth:validation.lastNameRequired") },
    };
  }

  if (trimmedLastName.length > PERSON_NAME_MAX_LENGTH) {
    return {
      data: null,
      error: {
        message: i18n.t("auth:validation.lastNameTooLong", {
          max: PERSON_NAME_MAX_LENGTH,
        }),
      },
    };
  }

  if (gender != null && (!Number.isInteger(gender) || gender < 0 || gender > 2)) {
    return {
      data: null,
      error: { message: i18n.t("auth:service.genderInvalid") },
    };
  }

  if (birthDate != null && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return {
      data: null,
      error: { message: i18n.t("auth:service.birthDateInvalid") },
    };
  }

  try {
    const response = await apiClient.post<AuthenticationResponse>(
      "/api/auth/register",
      {
        username: normalized,
        password,
        email: normalizedEmail,
        firstName: trimmedFirstName,
        lastName: trimmedLastName ?? null,
        gender,
        birthDate,
      },
    );

    return persistAuthSession(response.data, normalized, {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: normalizedEmail,
    });
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error, "auth:service.registerFailed"),
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
      error: toErrorMessage(error, "auth:service.logoutFailed"),
    };
  }
}

/**
 * DELETE /api/auth/me — soft-deletes the account server-side (Status → Deleted,
 * every session revoked) and clears the local session so the app returns to
 * signed-out. Idempotent from the client's perspective: whether the server call
 * fails or succeeds, only the caller decides whether to keep the local session.
 */
export async function deleteAccount(): Promise<AuthActionResult> {
  try {
    await apiClient.delete("/api/auth/me");

    await clearCurrentDevicePushToken().catch((error) => {
      console.warn("Push token kaldırılamadı:", error);
    });
    await apiClient.clearToken();

    return { error: null };
  } catch (error) {
    return {
      error: toErrorMessage(error, "auth:service.deleteAccountFailed"),
    };
  }
}

/**
 * POST /api/auth/email/verify
 */
export async function verifyEmail(code: string): Promise<AuthActionResult> {
  try {
    await apiClient.post("/api/auth/email/verify", { code: code.trim() });

    const user = await apiClient.getUser();
    if (user) {
      await apiClient.setUser({ ...user, isEmailVerified: true });
    }

    return { error: null };
  } catch (error) {
    return {
      error: toErrorMessage(error, "auth:service.verifyEmailFailed"),
    };
  }
}

/**
 * POST /api/auth/email/resend
 */
export async function resendEmailVerification(): Promise<AuthActionResult> {
  try {
    await apiClient.post("/api/auth/email/resend", {});
    return { error: null };
  } catch (error) {
    return {
      error: toErrorMessage(
        error,
        "auth:service.resendEmailVerificationFailed",
      ),
    };
  }
}

/**
 * POST /api/auth/password/forgot
 *
 * Always resolves without an error, whether or not the email belongs to an account — the
 * backend intentionally responds the same way in both cases (account enumeration defense), so
 * the UI should show a generic "check your email" message regardless of the outcome here.
 */
export async function requestPasswordReset(
  email: string,
): Promise<AuthActionResult> {
  const emailError = validateEmail(normalizeEmail(email));
  if (emailError) {
    return { error: { message: emailError } };
  }

  try {
    await apiClient.post("/api/auth/password/forgot", {
      email: normalizeEmail(email),
    });
    return { error: null };
  } catch (error) {
    return {
      error: toErrorMessage(error, "auth:service.requestPasswordResetFailed"),
    };
  }
}

/**
 * POST /api/auth/password/reset
 */
export async function resetPassword({
  email,
  code,
  newPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  const passwordError = validatePassword(newPassword, true);
  if (passwordError) {
    return { error: { message: passwordError } };
  }

  try {
    await apiClient.post("/api/auth/password/reset", {
      email: normalizeEmail(email),
      code: code.trim(),
      newPassword,
    });
    return { error: null };
  } catch (error) {
    return {
      error: toErrorMessage(error, "auth:service.resetPasswordFailed"),
    };
  }
}

/**
 * PUT /api/auth/me/language — backend'in kullanıcıya özel ürettiği içerikler
 * (şimdilik rozet/görev bildirimleri) bu dile göre yazılsın diye senkronize eder.
 * Best-effort: başarısız olursa sessizce yutulur, uygulamanın kendi dili etkilenmez.
 */
export async function syncPreferredLanguage(
  language: "tr" | "en",
): Promise<void> {
  try {
    await apiClient.put("/api/auth/me/language", {
      language: language === "en" ? 1 : 0,
    });
  } catch {
    // Best-effort: local UI language already switched regardless of server sync.
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
