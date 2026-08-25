export type StartupDestination =
  | "tabs"
  | "profile-setup"
  | "auth"
  | "first-launch";

type StartupInput = {
  authBypass: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  hasSeenOnboarding: boolean;
  /** In-memory only: Welcome → Login without completing intros. */
  isEnteringAuth?: boolean;
};

/**
 * Auth and first-launch flags stay independent.
 * Authenticated users never land on marketing onboarding.
 */
export function getStartupDestination({
  authBypass,
  isAuthenticated,
  isOnboarded,
  hasSeenOnboarding,
  isEnteringAuth = false,
}: StartupInput): StartupDestination {
  if (authBypass) {
    return "tabs";
  }

  if (isAuthenticated) {
    return isOnboarded ? "tabs" : "profile-setup";
  }

  return hasSeenOnboarding || isEnteringAuth ? "auth" : "first-launch";
}

export const STARTUP_HREF = {
  tabs: "/(tabs)",
  "profile-setup": "/(onboarding)",
  auth: "/(auth)/login",
  "first-launch": "/(first-launch)",
} as const;
