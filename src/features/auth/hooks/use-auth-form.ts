import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { useAuth, useFirstLaunch, useSession, useToast } from "@/contexts";
import {
  BIRTH_DATE_MAX_AGE,
  BIRTH_DATE_MIN_AGE,
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PERSON_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/constants/validation";
import type { AuthMode } from "@/features/auth/types";
import {
  formatBirthDateInput,
  isAllowedBirthDate,
  parseBirthDate,
  toApiBirthDate,
} from "@/utils/birth-date";

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
  } else if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
    errors.username = t("validation.usernameTooLong", {
      max: USERNAME_MAX_LENGTH,
    });
  } else if (!isLogin && trimmedUsername.length < USERNAME_MIN_LENGTH) {
    errors.username = t("validation.usernameTooShort", {
      min: USERNAME_MIN_LENGTH,
    });
  } else if (!isLogin && !USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = t("validation.usernameInvalidChars");
  }

  if (!password) {
    errors.password = t("validation.passwordRequired");
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = t("validation.passwordTooLong");
  } else if (!isLogin && password.length < PASSWORD_MIN_LENGTH) {
    errors.password = t("validation.passwordTooShort", {
      min: PASSWORD_MIN_LENGTH,
    });
  }

  if (!isLogin) {
    if (!trimmedEmail) {
      errors.email = t("validation.emailRequired");
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      errors.email = t("validation.emailTooLong", {
        max: EMAIL_MAX_LENGTH,
      });
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = t("validation.emailInvalid");
    }

    if (!trimmedFirstName) {
      errors.firstName = t("validation.firstNameRequired");
    } else if (trimmedFirstName.length > PERSON_NAME_MAX_LENGTH) {
      errors.firstName = t("validation.firstNameTooLong", {
        max: PERSON_NAME_MAX_LENGTH,
      });
    }

    if (!trimmedLastName) {
      errors.lastName = t("validation.lastNameRequired");
    } else if (trimmedLastName.length > PERSON_NAME_MAX_LENGTH) {
      errors.lastName = t("validation.lastNameTooLong", {
        max: PERSON_NAME_MAX_LENGTH,
      });
    }

    // Gender and birth date are optional (App Store 5.1.1(v)); a birth date
    // is only validated when the user chose to enter one.
    const parsedBirthDate = parseBirthDate(birthDate);
    if (!birthDate.trim()) {
      // optional
    } else if (!parsedBirthDate) {
      errors.birthDate = t("validation.birthDateInvalidFormat");
    } else if (!isAllowedBirthDate(parsedBirthDate)) {
      errors.birthDate = t("validation.birthDateOutOfRange", {
        min: BIRTH_DATE_MIN_AGE,
        max: BIRTH_DATE_MAX_AGE,
      });
    }

    if (!hasAcceptedLegalTerms) {
      errors.legalConsent = t("validation.legalConsentRequired");
    }
  }

  return errors;
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
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return false;
    }

    if (isLogin) {
      return (
        trimmedUsername.length <= USERNAME_MAX_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH
      );
    }

    const trimmedEmail = email.trim();

    return (
      trimmedUsername.length >= USERNAME_MIN_LENGTH &&
      trimmedUsername.length <= USERNAME_MAX_LENGTH &&
      USERNAME_PATTERN.test(trimmedUsername) &&
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH &&
      Boolean(trimmedEmail) &&
      trimmedEmail.length <= EMAIL_MAX_LENGTH &&
      EMAIL_PATTERN.test(trimmedEmail) &&
      Boolean(firstName.trim()) &&
      firstName.trim().length <= PERSON_NAME_MAX_LENGTH &&
      Boolean(lastName.trim()) &&
      lastName.trim().length <= PERSON_NAME_MAX_LENGTH &&
      (!birthDate.trim() ||
        Boolean(
          parseBirthDate(birthDate) &&
          isAllowedBirthDate(parseBirthDate(birthDate)!),
        )) &&
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
            gender: gender ? Number(gender) : null,
            birthDate: birthDate.trim() ? toApiBirthDate(birthDate) : null,
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
