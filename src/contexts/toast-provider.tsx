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
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

import { toastService } from "@/lib/toast-bus";
import type { IconName } from "@/types/components";
import type { ToastContextValue, ToastPayload, ToastType } from "@/types/toast";
import { AppText as Text } from "@/components/app-text";
import { themeColors } from "@/constants/theme";
import { OVERLAY_HIDE_MS } from "@/constants/motion";

type ToastState = {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
};

const DEFAULT_DURATION_MS = 2200;
const STRIPE_COUNT = 12;
const STRIPE_GAP = 34;
/** Yukarı kaydırma: bu kadar (pt) ya da bu hızla bırakılırsa kapanır. */
const SWIPE_UP_DISTANCE = -24;
const SWIPE_UP_VELOCITY = -600;
/** Yana kaydırma eşikleri. */
const SWIPE_SIDE_DISTANCE = 80;
const SWIPE_SIDE_VELOCITY = 800;

const toastTheme: Record<ToastType, { accent: string; icon: IconName }> = {
  success: { accent: themeColors.brand.primary, icon: "check" },
  error: { accent: themeColors.destructive, icon: "triangle-exclamation" },
  info: { accent: themeColors.success, icon: "circle-info" },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const toastIdRef = useRef<number | null>(null);
  const durationRef = useRef(DEFAULT_DURATION_MS);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);
  const progress = useSharedValue(1);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hide = useCallback(
    (toastId: number) => {
      clearPendingTimeout();

      opacity.value = withTiming(0, { duration: OVERLAY_HIDE_MS });
      translateY.value = withTiming(-12, { duration: OVERLAY_HIDE_MS });

      timeoutRef.current = setTimeout(() => {
        setToast((prev) => (prev?.id === toastId ? null : prev));
      }, OVERLAY_HIDE_MS + 20);
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
      toastIdRef.current = currentId;
      durationRef.current = duration;

      opacity.value = 0;
      translateY.value = -16;
      dragX.value = 0;
      dragY.value = 0;
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
    [clearPendingTimeout, dragX, dragY, hide, opacity, progress, translateY],
  );

  // Parmak kartın üstündeyken süre durur; vazgeçilirse kalan süreyle devam eder.
  const pauseAutoHide = useCallback(() => {
    clearPendingTimeout();
    cancelAnimation(progress);
  }, [clearPendingTimeout, progress]);

  const resumeAutoHide = useCallback(
    (remaining: number) => {
      const toastId = toastIdRef.current;
      if (toastId == null) return;
      const remainingMs = Math.max(remaining * durationRef.current, 600);
      clearPendingTimeout();
      progress.value = withTiming(0, {
        duration: remainingMs,
        easing: Easing.linear,
      });
      timeoutRef.current = setTimeout(() => hide(toastId), remainingMs);
    },
    [clearPendingTimeout, hide, progress],
  );

  const dismissFromGesture = useCallback(() => {
    const toastId = toastIdRef.current;
    clearPendingTimeout();
    setToast((prev) => (prev?.id === toastId ? null : prev));
  }, [clearPendingTimeout]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .activeOffsetY([-8, 8])
        .onStart(() => {
          scheduleOnRN(pauseAutoHide);
        })
        .onUpdate((event) => {
          dragX.value = event.translationX;
          // Aşağı çekmek kapatmaz; hafif dirençle izin verilir.
          dragY.value =
            event.translationY < 0
              ? event.translationY
              : event.translationY * 0.2;
        })
        .onEnd((event) => {
          const dismissUp =
            dragY.value < SWIPE_UP_DISTANCE ||
            event.velocityY < SWIPE_UP_VELOCITY;
          const dismissSide =
            Math.abs(dragX.value) > SWIPE_SIDE_DISTANCE ||
            Math.abs(event.velocityX) > SWIPE_SIDE_VELOCITY;

          if (dismissUp || dismissSide) {
            opacity.value = withTiming(0, { duration: OVERLAY_HIDE_MS });
            if (dismissSide && !dismissUp) {
              const direction = (dragX.value || event.velocityX) < 0 ? -1 : 1;
              dragX.value = withTiming(direction * 420, {
                duration: OVERLAY_HIDE_MS,
              });
            } else {
              dragY.value = withTiming(-120, { duration: OVERLAY_HIDE_MS });
            }
            translateY.value = withTiming(
              translateY.value,
              { duration: OVERLAY_HIDE_MS },
              (finished) => {
                if (finished) scheduleOnRN(dismissFromGesture);
              },
            );
            return;
          }

          dragX.value = withSpring(0, { dampingRatio: 0.8, duration: 260 });
          dragY.value = withSpring(0, { dampingRatio: 0.8, duration: 260 });
          scheduleOnRN(resumeAutoHide, progress.value);
        }),
    [
      dismissFromGesture,
      dragX,
      dragY,
      opacity,
      pauseAutoHide,
      progress,
      resumeAutoHide,
      translateY,
    ],
  );

  useEffect(() => {
    return toastService.subscribe(showToast);
  }, [showToast]);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: dragX.value },
      { translateY: translateY.value + dragY.value },
    ],
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
          <GestureDetector gesture={panGesture}>
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
              className="mx-4 overflow-hidden rounded-2xl border bg-surface-primary"
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
                    <Text className="font-body-bold text-body-sm text-white">
                      {toast.title}
                    </Text>

                    {!!toast.description && (
                      <Text className="mt-0.5 font-body text-caption text-text-tertiary">
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
          </GestureDetector>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
