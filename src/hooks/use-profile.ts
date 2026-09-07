import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AUTH_BYPASS } from "@/constants/env";
import { useAuth, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyProfile,
  ProfileNotFoundError,
} from "@/services/profile-service";
import type { UserProfile } from "@/types/profile";

export function useProfile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation(["profile", "settings"]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      setNotFound(false);
      setProfile(await getMyProfile());
    } catch (err) {
      if (err instanceof ProfileNotFoundError) {
        setNotFound(true);
        setProfile(null);
        setError(err.message);
      } else {
        setNotFound(false);
        setProfile(null);
        setError(getApiErrorMessage(err, t("profile:loadFailed")));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  const refresh = useCallback(() => load("refresh"), [load]);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current ? "refresh" : "initial").finally(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

  const logout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const { error: signOutError } = await signOut();

      if (signOutError && !AUTH_BYPASS) {
        showToast({
          type: "error",
          title: t("settings:logoutToasts.failed"),
          description: signOutError.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: t("settings:logoutToasts.success"),
        description: AUTH_BYPASS
          ? t("settings:logoutToasts.bypassDescription")
          : t("settings:logoutToasts.farewell"),
      });

      router.replace("/(auth)/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    profile,
    isLoading,
    isRefreshing,
    isSigningOut,
    error,
    notFound,
    refresh,
    logout,
  };
}
