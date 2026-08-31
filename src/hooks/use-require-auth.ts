import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useAuth, useFirstLaunch, useToast } from "@/contexts";

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { enterAuthWithoutCompleting } = useFirstLaunch();
  const { showToast } = useToast();

  const requireAuth = useCallback(
    (reason = "Bu işlem için giriş yapmalısın.") => {
      if (isAuthenticated) return true;

      showToast({
        type: "info",
        title: "Giriş yapman gerekiyor",
        description: reason,
      });
      enterAuthWithoutCompleting();
      router.push("/(auth)/login");
      return false;
    },
    [enterAuthWithoutCompleting, isAuthenticated, router, showToast],
  );

  return { isAuthenticated, requireAuth };
}
