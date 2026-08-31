import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  type RefCallback,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { View } from "react-native";

export type AppTourTarget = "create" | "conversations" | "discover";

type AppTourContextValue = {
  isVisible: boolean;
  step: number;
  target: AppTourTarget;
  registerTarget: (target: AppTourTarget) => RefCallback<View>;
  getTarget: (target: AppTourTarget) => View | null;
  startTour: () => void;
  next: () => void;
  dismiss: () => void;
};

const STORAGE_KEY = "sportner:app-tour:v1";
const TARGETS: AppTourTarget[] = ["create", "conversations", "discover"];
const AppTourContext = createContext<AppTourContextValue | null>(null);

export function AppTourProvider({
  children,
  autoStart = true,
}: PropsWithChildren<{ autoStart?: boolean }>) {
  const nodes = useRef<Partial<Record<AppTourTarget, View | null>>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!autoStart) return;
    let active = true;
    const timer = setTimeout(() => {
      void AsyncStorage.getItem(STORAGE_KEY).then((seen) => {
        if (active && seen !== "true") setIsVisible(true);
      });
    }, 750);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [autoStart]);

  const registerTarget = useCallback(
    (target: AppTourTarget): RefCallback<View> =>
      (node) => {
        nodes.current[target] = node;
      },
    [],
  );

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setStep(0);
    void AsyncStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const value = useMemo<AppTourContextValue>(
    () => ({
      isVisible,
      step,
      target: TARGETS[step] ?? TARGETS[0],
      registerTarget,
      getTarget: (target) => nodes.current[target] ?? null,
      startTour: () => {
        setStep(0);
        setIsVisible(true);
      },
      next: () => {
        if (step >= TARGETS.length - 1) dismiss();
        else setStep((current) => current + 1);
      },
      dismiss,
    }),
    [dismiss, isVisible, registerTarget, step],
  );

  return (
    <AppTourContext.Provider value={value}>{children}</AppTourContext.Provider>
  );
}

export function useAppTour() {
  const context = useContext(AppTourContext);
  if (!context)
    throw new Error("useAppTour AppTourProvider içinde kullanılmalı.");
  return context;
}
