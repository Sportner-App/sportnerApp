import type {
  AuthenticationResponse,
  AuthResult,
  AuthUser,
} from "@/features/auth/types";
import { getMyProfile } from "@/features/profile/services/profile-service";
import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatFullName } from "@/utils/person";

type UserHints = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
};

/** Servis hatalarını ekranların beklediği `{ message }` biçimine çevirir. */
export function toErrorMessage(error: unknown, fallbackKey: string) {
  return { message: getApiErrorMessage(error, i18n.t(fallbackKey)) };
}

function toAuthUser(
  response: AuthenticationResponse,
  username?: string,
  hints?: UserHints,
): AuthUser {
  const firstName = hints?.firstName?.trim();
  const lastName = hints?.lastName?.trim();

  return {
    id: response.userId,
    username,
    firstName,
    lastName,
    fullName: formatFullName(firstName, lastName) || undefined,
    email: hints?.email,
    isEmailVerified: response.isEmailVerified,
    avatarUrl: hints?.avatarUrl,
    isNewUser: response.isNewUser,
    isOnboarded: response.isOnboardingCompleted,
  };
}

function toAuthResult(
  body: AuthenticationResponse,
  user: AuthUser,
): AuthResult {
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

function assertCompleteResponse(body: AuthenticationResponse) {
  if (!body?.accessToken || !body?.userId || !body?.refreshToken) {
    throw new Error(i18n.t("auth:service.invalidApiResponse"));
  }
}

async function storeSession(body: AuthenticationResponse, user: AuthUser) {
  await apiClient.setSession({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    user,
  });
}

/** Kullanıcı adı/şifre ile giriş ve kayıt yanıtını oturuma yazar. */
export async function persistAuthSession(
  body: AuthenticationResponse,
  username: string,
  hints?: UserHints,
): Promise<AuthResult> {
  assertCompleteResponse(body);
  const user = toAuthUser(body, username, hints);
  await storeSession(body, user);
  return toAuthResult(body, user);
}

/**
 * Google/Apple yanıtı profil alanı taşımaz; oturum yazıldıktan sonra profil
 * çekilip kullanıcıya eklenir. Profil yoksa (eski hesaplar) ipuçlarıyla devam edilir.
 */
export async function persistExternalAuthSession(
  body: AuthenticationResponse,
  hints?: UserHints,
): Promise<AuthResult> {
  assertCompleteResponse(body);
  const user = toAuthUser(body, undefined, hints);
  await storeSession(body, user);

  try {
    const profile = await getMyProfile();
    const mergedUser: AuthUser = {
      ...user,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName ?? undefined,
      fullName:
        formatFullName(profile.firstName, profile.lastName) || undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
    await apiClient.setUser(mergedUser);
    return toAuthResult(body, mergedUser);
  } catch {
    // Best-effort compatibility for legacy profile-less accounts.
  }

  return toAuthResult(body, user);
}
