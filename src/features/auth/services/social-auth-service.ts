import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";

import type {
  AuthenticationResponse,
  AuthResult,
  CompleteExternalRegistrationPayload,
  ExternalAuthResult,
  ExternalSignInResponse,
} from "@/features/auth/types";
import { normalizeUsername } from "@/features/auth/validation";
import i18n from "@/i18n";
import { apiClient } from "@/lib/api/client";

import { persistExternalAuthSession, toErrorMessage } from "./session-store";

function toExternalRegistration(body: ExternalSignInResponse) {
  if (
    !body.registrationToken ||
    !body.registrationTokenExpiresAt ||
    !body.suggestedUsername
  ) {
    throw new Error(i18n.t("auth:service.invalidExternalRegistration"));
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
    throw new Error(i18n.t("auth:service.invalidExternalSignIn"));
  }

  const result = await persistExternalAuthSession(body.authentication);
  return result.error
    ? { data: null, registration: null, error: result.error }
    : { data: result.data, registration: null, error: null };
}

function externalFailure(message: { message: string }): ExternalAuthResult {
  return { data: null, registration: null, error: message };
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
    throw new Error(i18n.t("auth:service.googleNotAvailable"));
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
      return externalFailure({
        message: i18n.t("auth:service.googleTokenFailed"),
      });
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

    return externalFailure(
      toErrorMessage(error, "auth:service.googleSignInFailed"),
    );
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
      return externalFailure({
        message: i18n.t("auth:service.appleTokenFailed"),
      });
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

    return externalFailure(
      toErrorMessage(error, "auth:service.appleSignInFailed"),
    );
  }
}

/** POST /api/auth/external/complete — sosyal kayıtta eksik profil alanlarıyla hesabı açar. */
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
      error: toErrorMessage(error, "auth:service.externalRegistrationFailed"),
    };
  }
}
