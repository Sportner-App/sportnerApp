import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

import { toastService } from "@/services/toast-service";
import type { IconName } from "@/types/components";
import type { ToastContextValue, ToastPayload, ToastType } from "@/types/toast";

type ToastState = {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
};

const DEFAULT_DURATION_MS = 2200;
const HIDE_ANIMATION_MS = 180;
const STRIPE_COUNT = 12;
const STRIPE_GAP = 34;

const toastTheme: Record<ToastType, { accent: string; icon: IconName }> = {
  success: { accent: "#ccff00", icon: "check" },
  error: { accent: "#ed4a3e", icon: "triangle-exclamation" },
  info: { accent: "#5eead4", icon: "circle-info" },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);
  const progress = useSharedValue(1);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hide = useCallback(
    (toastId: number) => {
      clearPendingTimeout();

      opacity.value = withTiming(0, { duration: HIDE_ANIMATION_MS });
      translateY.value = withTiming(-12, { duration: HIDE_ANIMATION_MS });

      timeoutRef.current = setTimeout(() => {
        setToast((prev) => (prev?.id === toastId ? null : prev));
      }, HIDE_ANIMATION_MS + 20);
    },
    [clearPendingTimeout, opacity, translateY],
  );

  const showToast = useCallback(
    ({ title, description, type = "info", durationMs }: ToastPayload) => {
      clearPendingTimeout();

      idRef.current += 1;
      const currentId = idRef.current;
      const duration = durationMs ?? DEFAULT_DURATION_MS;

      setToast({ id: currentId, title, description, type });

      opacity.value = 0;
      translateY.value = -16;
      progress.value = 1;

      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      progress.value = withTiming(0, {
        duration,
        easing: Easing.linear,
      });

      timeoutRef.current = setTimeout(() => hide(currentId), duration);
    },
    [clearPendingTimeout, hide, opacity, progress, translateY],
  );

  useEffect(() => {
    return toastService.subscribe(showToast);
  }, [showToast]);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  const theme = toast ? toastTheme[toast.type] : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0"
        style={{ top: insets.top + 10 }}
      >
        {toast && theme ? (
          <Animated.View
            style={[
              cardStyle,
              {
                borderColor: `${theme.accent}40`,
                shadowColor: theme.accent,
                shadowOpacity: 0.25,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              },
            ]}
            className="mx-4 overflow-hidden rounded-2xl border bg-brand-surface"
          >
            <Pressable onPress={() => hide(toast.id)}>
              {/* Çizgisel doku */}
              <Svg
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
              >
                {Array.from({ length: STRIPE_COUNT }).map((_, index) => (
                  <Line
                    key={index}
                    x1={index * STRIPE_GAP}
                    y1={96}
                    x2={index * STRIPE_GAP + 44}
                    y2={-12}
                    stroke={theme.accent}
                    strokeWidth={1.5}
                    strokeOpacity={0.07}
                  />
                ))}
              </Svg>

              {/* Sol neon vurgu çizgisi */}
              <View
                className="absolute bottom-0 left-0 top-0 w-1"
                style={{ backgroundColor: theme.accent }}
              />

              <View className="flex-row items-center gap-3 py-3.5 pl-4 pr-4">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${theme.accent}33`,
                    backgroundColor: `${theme.accent}1A`,
                  }}
                >
                  <FontAwesome6
                    name={theme.icon}
                    size={14}
                    color={theme.accent}
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-body text-sm font-semibold text-white">
                    {toast.title}
                  </Text>

                  {!!toast.description && (
                    <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                      {toast.description}
                    </Text>
                  )}
                </View>
              </View>

              {/* Kalan süre çizgisi */}
              <View
                className="h-[3px] w-full bg-white/5"
                onLayout={(event) =>
                  setTrackWidth(event.nativeEvent.layout.width)
                }
              >
                <Animated.View
                  style={[progressStyle, { backgroundColor: theme.accent }]}
                  className="h-full"
                />
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast ToastProvider içinde kullanılmalı.");
  }

  return context;
}
