import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useFirstLaunch, useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ExternalRegistration } from "@/types/auth";

type SocialProvider = "google" | "apple";

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function toApiBirthDate(value: string) {
  const [day, month, year] = value.split(".").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
  const age = today.getFullYear() - year - (today < birthdayThisYear ? 1 : 0);
  if (
    !day ||
    !month ||
    !year ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    age < 13 ||
    age > 120
  )
    return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function useSocialAuth() {
  const router = useRouter();
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
    if (AUTH_BYPASS) return router.replace("/(tabs)");
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
          title: "Giriş başarısız",
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
        title: "Giriş başarısız",
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const completeRegistration = async () => {
    if (!pendingRegistration || isCompleting) return;
    const normalizedUsername = username.trim().toLowerCase();
    const apiBirthDate = toApiBirthDate(birthDate);
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(normalizedUsername)) {
      showToast({
        type: "error",
        title: "Kullanıcı adını kontrol et",
        description:
          "3–30 karakter; yalnızca harf, rakam, . ve _ kullanabilirsin.",
      });
      return;
    }
    if (!firstName.trim()) {
      showToast({
        type: "error",
        title: "Ad gerekli",
        description: "Adını kontrol edip tekrar dene.",
      });
      return;
    }
    if (!apiBirthDate) {
      showToast({
        type: "error",
        title: "Doğum tarihini kontrol et",
        description: "GG.AA.YYYY formatında ve en az 13 yaşında olmalısın.",
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
          title: "Kayıt tamamlanamadı",
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
    setBirthDate: (value: string) => setBirthDateState(formatBirthDate(value)),
    isCompleting,
    completeRegistration,
    cancelRegistration: () => setPendingRegistration(null),
  };
}
