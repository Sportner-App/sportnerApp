import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

type ToastPayload = {
  title: string;
  description?: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastState = {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const DEFAULT_DURATION_MS = 2200;

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(type: ToastType) {
  if (type === "success") {
    return {
      container: "border-emerald-300/40 bg-emerald-950/80",
      title: "text-emerald-200",
      description: "text-emerald-100/90",
    };
  }

  if (type === "error") {
    return {
      container: "border-rose-300/40 bg-rose-950/80",
      title: "text-rose-200",
      description: "text-rose-100/90",
    };
  }

  return {
    container: "border-brand-tertiary bg-brand-surface",
    title: "text-white",
    description: "text-brand-neutral",
  };
}

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    ({ title, description, type = "info", durationMs }: ToastPayload) => {
      clearPendingTimeout();

      idRef.current += 1;
      const currentId = idRef.current;

      setToast({
        id: currentId,
        title,
        description,
        type,
      });

      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(-14);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -10,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast((prev) => (prev?.id === currentId ? null : prev));
        });
      }, durationMs ?? DEFAULT_DURATION_MS);
    },
    [clearPendingTimeout, opacity, translateY],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  const typeStyles = toast ? getToastStyles(toast.type) : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0"
        style={{ top: insets.top + 10 }}
      >
        {toast && typeStyles ? (
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }],
            }}
            className={`mx-4 rounded-2xl border px-4 py-3 ${typeStyles.container}`}
          >
            <Text
              className={`font-body text-sm font-semibold ${typeStyles.title}`}
            >
              {toast.title}
            </Text>

            {!!toast.description && (
              <Text
                className={`mt-1 font-body text-xs ${typeStyles.description}`}
              >
                {toast.description}
              </Text>
            )}
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast ToastProvider icinde kullanilmali.");
  }

  return context;
}
