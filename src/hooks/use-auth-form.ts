import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useFirstLaunch, useSession, useToast } from "@/contexts";
import type { AuthMode } from "@/types/auth";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthFieldErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  legalConsent?: string;
};

const EMPTY_FIELD_ERRORS: AuthFieldErrors = {};

function getAuthFieldErrors(
  t: TFunction<"auth">,
  isLogin: boolean,
  username: string,
  password: string,
  email: string,
  firstName: string,
  lastName: string,
  gender: string,
  birthDate: string,
  hasAcceptedLegalTerms: boolean,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  if (!trimmedUsername) {
    errors.username = t("validation.usernameRequired");
  } else if (trimmedUsername.length > 30) {
    errors.username = t("validation.usernameTooLong", { max: 30 });
  } else if (!isLogin && trimmedUsername.length < 3) {
    errors.username = t("validation.usernameTooShort", { min: 3 });
  } else if (!isLogin && !USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = t("validation.usernameInvalidChars");
  }

  if (!password) {
    errors.password = t("validation.passwordRequired");
  } else if (password.length > 128) {
    errors.password = t("validation.passwordTooLong");
  } else if (!isLogin && password.length < 8) {
    errors.password = t("validation.passwordTooShort", { min: 8 });
  }

  if (!isLogin) {
    if (!trimmedEmail) {
      errors.email = t("validation.emailRequired");
    } else if (trimmedEmail.length > 254) {
      errors.email = t("validation.emailTooLong", { max: 254 });
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = t("validation.emailInvalid");
    }

    if (!trimmedFirstName) {
      errors.firstName = t("validation.firstNameRequired");
    } else if (trimmedFirstName.length > 50) {
      errors.firstName = t("validation.firstNameTooLong", { max: 50 });
    }

    if (!trimmedLastName) {
      errors.lastName = t("validation.lastNameRequired");
    } else if (trimmedLastName.length > 50) {
      errors.lastName = t("validation.lastNameTooLong", { max: 50 });
    }

    if (!gender) {
      errors.gender = t("validation.genderRequired");
    }

    const parsedBirthDate = parseBirthDate(birthDate);
    if (!birthDate.trim()) {
      errors.birthDate = t("validation.birthDateRequired");
    } else if (!parsedBirthDate) {
      errors.birthDate = t("validation.birthDateInvalidFormat");
    } else if (!isAllowedBirthDate(parsedBirthDate)) {
      errors.birthDate = t("validation.birthDateOutOfRange", {
        min: 13,
        max: 120,
      });
    }

    if (!hasAcceptedLegalTerms) {
      errors.legalConsent = t("validation.legalConsentRequired");
    }
  }

  return errors;
}

function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function isAllowedBirthDate(date: Date) {
  const today = new Date();
  const youngest = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  );
  const oldest = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate(),
  );
  return date >= oldest && date <= youngest;
}

function toApiBirthDate(value: string) {
  const [day, month, year] = value.trim().split(".");
  return `${year}-${month}-${day}`;
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function useAuthForm() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const { login, register, isReady } = useAuth();
  const { markOnboardingSeen } = useFirstLaunch();
  const { refreshSession } = useSession();
  const { showToast } = useToast();

  const [mode, setModeState] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDateState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [hasAcceptedLegalTerms, setHasAcceptedLegalTerms] = useState(false);

  const isLogin = mode === "login";

  const setMode = useCallback((nextMode: AuthMode) => {
    setModeState(nextMode);
    setUsername("");
    setPassword("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setGender("");
    setBirthDateState("");
    setHasAcceptedLegalTerms(false);
    setHasAttemptedSubmit(false);
  }, []);

  const setBirthDate = useCallback((value: string) => {
    setBirthDateState(formatBirthDateInput(value));
  }, []);

  const canSubmit = useMemo(() => {
    if (AUTH_BYPASS) {
      return true;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return false;
    }

    if (isLogin) {
      return trimmedUsername.length <= 30 && password.length <= 128;
    }

    const trimmedEmail = email.trim();

    return (
      trimmedUsername.length >= 3 &&
      trimmedUsername.length <= 30 &&
      USERNAME_PATTERN.test(trimmedUsername) &&
      password.length >= 8 &&
      password.length <= 128 &&
      Boolean(trimmedEmail) &&
      trimmedEmail.length <= 254 &&
      EMAIL_PATTERN.test(trimmedEmail) &&
      Boolean(firstName.trim()) &&
      firstName.trim().length <= 50 &&
      Boolean(lastName.trim()) &&
      lastName.trim().length <= 50 &&
      Boolean(gender) &&
      Boolean(
        parseBirthDate(birthDate) &&
        isAllowedBirthDate(parseBirthDate(birthDate)!),
      ) &&
      hasAcceptedLegalTerms
    );
  }, [
    username,
    password,
    email,
    firstName,
    lastName,
    gender,
    birthDate,
    hasAcceptedLegalTerms,
    isLogin,
  ]);

  const fieldErrors = useMemo(
    () =>
      hasAttemptedSubmit
        ? getAuthFieldErrors(
            t,
            isLogin,
            username,
            password,
            email,
            firstName,
            lastName,
            gender,
            birthDate,
            hasAcceptedLegalTerms,
          )
        : EMPTY_FIELD_ERRORS,
    [
      birthDate,
      email,
      firstName,
      gender,
      hasAttemptedSubmit,
      hasAcceptedLegalTerms,
      isLogin,
      lastName,
      password,
      t,
      username,
    ],
  );

  const toggleMode = () => setMode(isLogin ? "register" : "login");

  const requireLegalConsent = () => {
    setHasAttemptedSubmit(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const submit = async () => {
    if (AUTH_BYPASS) {
      router.replace("/(tabs)");
      return;
    }

    if (isLoading) {
      return;
    }

    if (!canSubmit) {
      setHasAttemptedSubmit(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isReady) {
      return;
    }

    setIsLoading(true);

    try {
      const response = isLogin
        ? await login({
            username: username.trim(),
            password,
          })
        : await register({
            username: username.trim(),
            password,
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender: Number(gender),
            birthDate: toApiBirthDate(birthDate),
          });

      if (response.error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({
          type: "error",
          title: isLogin
            ? t("toast.loginFailedTitle")
            : t("toast.registerFailedTitle"),
          description: response.error.message,
        });
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: "success",
        title: isLogin
          ? t("toast.loginSuccessTitle")
          : t("toast.registerSuccessTitle"),
        description: response.data.isOnboardingCompleted
          ? t("toast.welcomeBack")
          : t("toast.completeProfile"),
      });

      await markOnboardingSeen();
      await refreshSession?.();
      router.replace(
        !response.data.user.isEmailVerified
          ? "/(verify-email)"
          : response.data.isOnboardingCompleted
            ? "/(tabs)"
            : "/(onboarding)",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    setMode,
    toggleMode,
    isLogin,
    username,
    setUsername,
    password,
    setPassword,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    gender,
    setGender,
    birthDate,
    setBirthDate,
    hasAcceptedLegalTerms,
    setHasAcceptedLegalTerms,
    isLoading,
    canSubmit,
    isReady,
    fieldErrors,
    requireLegalConsent,
    submit,
  };
}
