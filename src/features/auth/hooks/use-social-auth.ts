import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth, useFirstLaunch, useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/constants/validation";
import type { ExternalRegistration } from "@/features/auth/types";
import { formatBirthDateInput, toValidApiBirthDate } from "@/utils/birth-date";

type SocialProvider = "google" | "apple";

export function useSocialAuth() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const { signInWithGoogle, signInWithApple, completeExternalRegistration } =
    useAuth();
  const { markOnboardingSeen } = useFirstLaunch();
  const { refreshSession } = useSession();
  const { showToast } = useToast();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null,
  );
  const [pendingRegistration, setPendingRegistration] =
    useState<ExternalRegistration | null>(null);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDateState] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const finishSignIn = async (isOnboardingCompleted: boolean) => {
    await markOnboardingSeen();
    await refreshSession?.();
    router.replace(isOnboardingCompleted ? "/(tabs)" : "/(onboarding)");
  };

  const signIn = async (provider: SocialProvider) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      const result =
        provider === "google"
          ? await signInWithGoogle()
          : await signInWithApple();
      if (!result) return;
      if (result.error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({
          type: "error",
          title: t("socialToast.loginFailedTitle"),
          description: result.error.message,
        });
        return;
      }
      if (result.registration) {
        setPendingRegistration(result.registration);
        setUsername(result.registration.suggestedUsername);
        setFirstName(result.registration.firstName ?? "");
        setLastName(result.registration.lastName ?? "");
        setBirthDateState("");
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await finishSignIn(result.data.isOnboardingCompleted);
    } catch (error) {
      showToast({
        type: "error",
        title: t("socialToast.loginFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const completeRegistration = async () => {
    if (!pendingRegistration || isCompleting) return;
    const normalizedUsername = username.trim().toLowerCase();
    const apiBirthDate = toValidApiBirthDate(birthDate);
    if (
      normalizedUsername.length < USERNAME_MIN_LENGTH ||
      normalizedUsername.length > USERNAME_MAX_LENGTH ||
      !USERNAME_PATTERN.test(normalizedUsername)
    ) {
      showToast({
        type: "error",
        title: t("socialToast.usernameCheckTitle"),
        description: t("socialToast.usernameCheckDescription"),
      });
      return;
    }
    if (!firstName.trim()) {
      showToast({
        type: "error",
        title: t("socialToast.firstNameRequiredTitle"),
        description: t("socialToast.firstNameRequiredDescription"),
      });
      return;
    }
    if (!apiBirthDate) {
      showToast({
        type: "error",
        title: t("socialToast.birthDateCheckTitle"),
        description: t("socialToast.birthDateCheckDescription"),
      });
      return;
    }
    setIsCompleting(true);
    try {
      const result = await completeExternalRegistration({
        registrationToken: pendingRegistration.registrationToken,
        username: normalizedUsername,
        firstName,
        lastName,
        birthDate: apiBirthDate,
        profileImageUrl: pendingRegistration.profileImageUrl,
      });
      if (result.error) {
        showToast({
          type: "error",
          title: t("socialToast.registrationFailedTitle"),
          description: result.error.message,
        });
        return;
      }
      setPendingRegistration(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await finishSignIn(false);
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    loadingProvider,
    signInWithGoogle: () => signIn("google"),
    signInWithApple: () => signIn("apple"),
    pendingRegistration,
    username,
    setUsername,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    birthDate,
    setBirthDate: (value: string) =>
      setBirthDateState(formatBirthDateInput(value)),
    isCompleting,
    completeRegistration,
    cancelRegistration: () => setPendingRegistration(null),
  };
}
