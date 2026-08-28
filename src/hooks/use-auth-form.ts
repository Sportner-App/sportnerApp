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
};

const EMPTY_FIELD_ERRORS: AuthFieldErrors = {};

function getAuthFieldErrors(
  isLogin: boolean,
  username: string,
  password: string,
  firstName: string,
  lastName: string,
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
  }

  return errors;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isLogin = mode === "login";

  const setMode = useCallback((nextMode: AuthMode) => {
    setModeState(nextMode);
    setUsername("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setHasAttemptedSubmit(false);
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
      lastName.trim().length <= 50
    );
  }, [username, password, firstName, lastName, isLogin]);

  const fieldErrors = useMemo(
    () =>
      hasAttemptedSubmit
        ? getAuthFieldErrors(isLogin, username, password, firstName, lastName)
        : EMPTY_FIELD_ERRORS,
    [firstName, hasAttemptedSubmit, isLogin, lastName, password, username],
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
    isLoading,
    canSubmit,
    isReady,
    fieldErrors,
    submit,
  };
}
