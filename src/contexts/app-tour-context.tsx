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

import { STORAGE_KEYS } from "@/constants/storage-keys";

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

const TARGETS: AppTourTarget[] = ["create", "conversations", "discover"];
const AppTourContext = createContext<AppTourContextValue | null>(null);

/**
 * Turun gösterildiğini kalıcı olarak işaretler. Hata yutulmuyor: yazma
 * başarısız olursa tur bir daha açılır, bunu sessizce kaybetmek yerine
 * günlüğe düşürüyoruz.
 */
function markSeen() {
  AsyncStorage.setItem(STORAGE_KEYS.appTourSeen, "true").catch((error) => {
    console.warn("App tour state could not be saved:", error);
  });
}

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
      void AsyncStorage.getItem(STORAGE_KEYS.appTourSeen).then((seen) => {
        if (!active || seen === "true") return;

        setIsVisible(true);
        // Bayrak turu kapatırken değil, açarken yazılıyor.
        //
        // Kapanışta yazıldığında kullanıcı turu bitirip hemen uygulamayı arka
        // plana attığında yazma diske inmeden süreç askıya alınıp
        // öldürülebiliyordu; dönüşte bayrak bulunamadığı için tur bir kez daha
        // açılıyordu. İkinci kapanışta uygulamada daha uzun kalındığı için
        // yazma tamamlanıyor ve sorun kendiliğinden "düzelmiş" gibi görünüyordu.
        //
        // Burada yazmak yarışı tamamen kaldırıyor: tur göründüğü anda zaten
        // gösterilmiş sayılır. Yarıda bırakan kullanıcı için Ayarlar'da
        // "Uygulama turunu yeniden göster" duruyor.
        markSeen();
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
    // Tur gösterilirken zaten işaretlendi; burası elle başlatılan tekrar
    // gösterimler için ve bayrağın bir sebeple yazılamadığı durumda ikinci şans.
    markSeen();
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
    throw new Error("useAppTour must be used within AppTourProvider.");
  return context;
}
