import { createContext, useContext } from "react";

export type FirstLaunchContextValue = {
  isReady: boolean;
  hasSeenOnboarding: boolean;
  isEnteringAuth: boolean;
  markOnboardingSeen: () => Promise<void>;
  enterAuthWithoutCompleting: () => void;
};

export const FirstLaunchContext = createContext<FirstLaunchContextValue | null>(
  null,
);

export function useFirstLaunch() {
  const context = useContext(FirstLaunchContext);

  if (!context) {
    throw new Error("useFirstLaunch FirstLaunchProvider içinde kullanılmalı.");
  }

  return context;
}
