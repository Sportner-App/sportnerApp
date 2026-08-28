import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useFirstLaunch, useSession, useToast } from "@/contexts";
import type { AuthMode } from "@/types/auth";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

type AuthFieldErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  gender?: string;
  birthDate?: string;
};

const EMPTY_FIELD_ERRORS: AuthFieldErrors = {};

function getAuthFieldErrors(
  isLogin: boolean,
  username: string,
  password: string,
  firstName: string,
  lastName: string,
  gender: string,
  birthDate: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const trimmedUsername = username.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  if (!trimmedUsername) {
    errors.username = "Kullanıcı adı gerekli.";
  } else if (trimmedUsername.length > 30) {
    errors.username = "Kullanıcı adı en fazla 30 karakter olabilir.";
  } else if (!isLogin && trimmedUsername.length < 3) {
    errors.username = "Kullanıcı adı en az 3 karakter olmalı.";
  } else if (!isLogin && !USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = "Kullanıcı adı yalnızca harf, rakam, . ve _ içerebilir.";
  }

  if (!password) {
    errors.password = "Şifre gerekli.";
  } else if (password.length > 128) {
    errors.password = "Şifre çok uzun.";
  } else if (!isLogin && password.length < 8) {
    errors.password = "Şifre en az 8 karakter olmalı.";
  }

  if (!isLogin) {
    if (!trimmedFirstName) {
      errors.firstName = "Ad gerekli.";
    } else if (trimmedFirstName.length > 50) {
      errors.firstName = "Ad en fazla 50 karakter olabilir.";
    }

    if (trimmedLastName.length > 50) {
      errors.lastName = "Soyad en fazla 50 karakter olabilir.";
    }

    if (!gender) {
      errors.gender = "Cinsiyet seçimi gerekli.";
    }

    const parsedBirthDate = parseBirthDate(birthDate);
    if (!birthDate.trim()) {
      errors.birthDate = "Doğum tarihi gerekli.";
    } else if (!parsedBirthDate) {
      errors.birthDate = "Tarihi GG.AA.YYYY formatında gir.";
    } else if (!isAllowedBirthDate(parsedBirthDate)) {
      errors.birthDate = "Yaş 13 ile 120 arasında olmalı.";
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
  const { login, register, isReady } = useAuth();
  const { markOnboardingSeen } = useFirstLaunch();
  const { refreshSession } = useSession();
  const { showToast } = useToast();

  const [mode, setModeState] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDateState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isLogin = mode === "login";

  const setMode = useCallback((nextMode: AuthMode) => {
    setModeState(nextMode);
    setUsername("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setGender("");
    setBirthDateState("");
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

    return (
      trimmedUsername.length >= 3 &&
      trimmedUsername.length <= 30 &&
      USERNAME_PATTERN.test(trimmedUsername) &&
      password.length >= 8 &&
      password.length <= 128 &&
      Boolean(firstName.trim()) &&
      firstName.trim().length <= 50 &&
      lastName.trim().length <= 50 &&
      Boolean(gender) &&
      Boolean(
        parseBirthDate(birthDate) &&
        isAllowedBirthDate(parseBirthDate(birthDate)!),
      )
    );
  }, [username, password, firstName, lastName, gender, birthDate, isLogin]);

  const fieldErrors = useMemo(
    () =>
      hasAttemptedSubmit
        ? getAuthFieldErrors(
            isLogin,
            username,
            password,
            firstName,
            lastName,
            gender,
            birthDate,
          )
        : EMPTY_FIELD_ERRORS,
    [
      birthDate,
      firstName,
      gender,
      hasAttemptedSubmit,
      isLogin,
      lastName,
      password,
      username,
    ],
  );

  const toggleMode = () => setMode(isLogin ? "register" : "login");

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
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            gender: Number(gender),
            birthDate: toApiBirthDate(birthDate),
          });

      if (response.error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({
          type: "error",
          title: isLogin ? "Giriş başarısız" : "Kayıt başarısız",
          description: response.error.message,
        });
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: "success",
        title: isLogin ? "Giriş başarılı" : "Hesabın oluşturuldu",
        description: response.data.isOnboardingCompleted
          ? "Hoş geldin!"
          : "Hadi profilini tamamlayalım.",
      });

      await markOnboardingSeen();
      await refreshSession?.();
      router.replace(
        response.data.isOnboardingCompleted ? "/(tabs)" : "/(onboarding)",
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
    firstName,
    setFirstName,
    lastName,
    setLastName,
    gender,
    setGender,
    birthDate,
    setBirthDate,
    isLoading,
    canSubmit,
    isReady,
    fieldErrors,
    submit,
  };
}
