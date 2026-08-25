import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useSession, useToast } from "@/contexts";
import { uploadAvatar } from "@/services/profile-service";
import type { AuthMode } from "@/types/auth";
import { pickProfileImage, type PickedMedia } from "@/utils/media-picker";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

export function useAuthForm() {
  const router = useRouter();
  const { login, register, isReady } = useAuth();
  const { refreshSession } = useSession();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState<PickedMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === "login";

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

  const toggleMode = () => setMode(isLogin ? "register" : "login");

  const submit = async () => {
    if (AUTH_BYPASS) {
      router.replace("/(tabs)");
      return;
    }

    if (!isReady || !canSubmit || isLoading) {
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
        showToast({
          type: "error",
          title: isLogin ? "Giriş başarısız" : "Kayıt başarısız",
          description: response.error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: isLogin ? "Giriş başarılı" : "Hesabın oluşturuldu",
        description: response.data.isOnboardingCompleted
          ? "Hoş geldin!"
          : "Hadi profilini tamamlayalım.",
      });

      if (!isLogin && avatar) {
        try {
          await uploadAvatar(avatar);
        } catch {
          showToast({
            type: "error",
            title: "Fotoğraf yüklenemedi",
            description: "Hesabın açıldı; fotoğrafı profil kurulumunda ekleyebilirsin.",
          });
        }
      }

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
    avatar,
    chooseAvatar: async () => {
      const picked = await pickProfileImage();
      if (picked === "denied") {
        showToast({
          type: "error",
          title: "İzin gerekli",
          description: "Fotoğraf seçmek için galeri izni vermelisin.",
        });
        return;
      }
      if (picked !== "cancelled") {
        setAvatar(picked);
      }
    },
    clearAvatar: () => setAvatar(null),
    isLoading,
    canSubmit,
    isReady,
    submit,
  };
}
