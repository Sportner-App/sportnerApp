import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth, useToast } from "@/contexts";
import {
  useRefreshableLoad,
  type LoadMode,
} from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getMyProfile,
  ProfileNotFoundError,
} from "@/features/profile/services/profile-service";
import type { UserProfile } from "@/features/profile/types";

export function useProfile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation(["profile", "settings"]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(
    async (mode: LoadMode) => {
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
          if (mode === "initial") {
            setProfile(null);
          }
          setError(getApiErrorMessage(err, t("profile:loadFailed")));
        }
      }
    },
    [t],
  );

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
    refocusMode: "silent",
  });

  const logout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const { error: signOutError } = await signOut();

      if (signOutError) {
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
        description: t("settings:logoutToasts.farewell"),
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
