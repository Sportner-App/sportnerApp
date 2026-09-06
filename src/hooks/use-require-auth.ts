import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAuth, useFirstLaunch, useToast } from "@/contexts";

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { enterAuthWithoutCompleting } = useFirstLaunch();
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  const requireAuth = useCallback(
    (reason?: string) => {
      if (isAuthenticated) return true;

      showToast({
        type: "info",
        title: t("signInRequiredTitle"),
        description: reason ?? t("signInRequiredDefaultReason"),
      });
      enterAuthWithoutCompleting();
      router.push("/(auth)/login");
      return false;
    },
    [enterAuthWithoutCompleting, isAuthenticated, router, showToast, t],
  );

  return { isAuthenticated, requireAuth };
}
