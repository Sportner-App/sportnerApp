import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth, useToast } from "@/contexts";
import {
  joinChallenge,
  leaveChallenge,
  listChallenges,
} from "@/features/challenges/services/challenges-service";
import type { Challenge } from "@/features/challenges/types";
import { getApiErrorMessage } from "@/lib/api/errors";

/** Süren challenge'lar; ekran her odaklandığında tazelenir. */
export function useChallenges() {
  const { t } = useTranslation("badges");
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setChallenges([]);
        setIsLoading(false);
        return;
      }
      void listChallenges()
        .then(setChallenges)
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    }, [isAuthenticated]),
  );

  const replace = (updated: Challenge | null) => {
    if (!updated) return;
    setChallenges((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  };

  const run = async (
    id: string,
    action: (id: string) => Promise<Challenge | null>,
  ) => {
    if (busyId) return;
    setBusyId(id);
    try {
      replace(await action(id));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      showToast({
        type: "error",
        title: t("challenges.actionFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  return {
    challenges,
    isLoading,
    busyId,
    join: (id: string) => run(id, joinChallenge),
    leave: (id: string) => run(id, leaveChallenge),
  };
}
