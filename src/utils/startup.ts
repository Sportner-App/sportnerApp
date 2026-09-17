export type StartupDestination =
  "tabs" | "profile-setup" | "verify-email" | "auth" | "first-launch";

type StartupInput = {
  authBypass: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isOnboarded: boolean;
  hasSeenOnboarding: boolean;
  /** In-memory only: Welcome → Login without completing intros. */
  isEnteringAuth?: boolean;
};

/**
 * Auth and first-launch flags stay independent.
 * Authenticated users never land on marketing onboarding.
 * Email verification is checked before onboarding — password accounts start
 * unverified and are hard-gated here; social sign-in accounts are verified
 * server-side at registration so this never blocks them.
 */
export function getStartupDestination({
  authBypass,
  isAuthenticated,
  isEmailVerified,
  isOnboarded,
  hasSeenOnboarding,
  isEnteringAuth = false,
}: StartupInput): StartupDestination {
  if (authBypass) {
    return "tabs";
  }

  if (isAuthenticated) {
    if (!isEmailVerified) {
      return "verify-email";
    }
    return isOnboarded ? "tabs" : "profile-setup";
  }

  if (isEnteringAuth) {
    return "auth";
  }

  return hasSeenOnboarding ? "tabs" : "first-launch";
}

export const STARTUP_HREF = {
  tabs: "/(tabs)",
  "profile-setup": "/(onboarding)",
  "verify-email": "/(verify-email)",
  auth: "/(auth)/login",
  "first-launch": "/(first-launch)",
} as const;
