import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getHasSeenOnboarding,
  setHasSeenOnboarding,
} from "@/services/first-launch-storage";

import {
  FirstLaunchContext,
  type FirstLaunchContextValue,
} from "./first-launch-context";

export function FirstLaunchProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeen] = useState(false);
  const [isEnteringAuth, setIsEnteringAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getHasSeenOnboarding()
      .then((seen) => {
        if (isMounted) {
          setHasSeen(seen);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasSeen(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    await setHasSeenOnboarding();
    setHasSeen(true);
    setIsEnteringAuth(false);
  }, []);

  const enterAuthWithoutCompleting = useCallback(() => {
    setIsEnteringAuth(true);
  }, []);

  const value = useMemo<FirstLaunchContextValue>(
    () => ({
      isReady,
      hasSeenOnboarding,
      isEnteringAuth,
      markOnboardingSeen,
      enterAuthWithoutCompleting,
    }),
    [
      hasSeenOnboarding,
      isEnteringAuth,
      isReady,
      markOnboardingSeen,
      enterAuthWithoutCompleting,
    ],
  );

  return (
    <FirstLaunchContext.Provider value={value}>
      {children}
    </FirstLaunchContext.Provider>
  );
}
