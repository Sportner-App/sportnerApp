import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BottomSheetProps } from "@/types/components";

const OPEN_SPRING = {
  damping: 22,
  stiffness: 210,
  mass: 0.9,
  overshootClamping: false,
};

const CLOSE_DURATION_MS = 280;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.85;

/**
 * Uygulama genelinde select / date picker / aksiyon listeleri için
 * ortak bottom sheet kabuğu.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  showCancel = true,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const slideDistance = useSharedValue(Dimensions.get("window").height);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      progress.value = withSpring(1, OPEN_SPRING);
      return;
    }

    if (!mounted) {
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: CLOSE_DURATION_MS,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [dragY, mounted, progress, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          gesture.dy > 3 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          dragY.value = Math.max(gesture.dy, 0);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldDismiss =
            gesture.dy >= DISMISS_DISTANCE || gesture.vy >= DISMISS_VELOCITY;

          if (shouldDismiss) {
            dragY.value = withTiming(
              slideDistance.value,
              {
                duration: 220,
                easing: Easing.out(Easing.cubic),
              },
              (finished) => {
                if (finished) {
                  runOnJS(onClose)();
                }
              },
            );
            return;
          }

          dragY.value = withSpring(0, {
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          });
        },
        onPanResponderTerminate: () => {
          dragY.value = withSpring(0, {
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          });
        },
      }),
    [dragY, onClose, slideDistance],
  );

  const backdropStyle = useAnimatedStyle(() => {
    const dragProgress = Math.min(
      dragY.value / Math.max(slideDistance.value, 1),
      1,
    );

    return {
      opacity: progress.value * (1 - dragProgress),
    };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * slideDistance.value + dragY.value,
      },
    ],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0" onPress={onClose}>
          <Animated.View
            style={backdropStyle}
            className="absolute inset-0 bg-black/70"
          />
        </Pressable>

        <Animated.View
          style={sheetStyle}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0) {
              slideDistance.value = height;
            }
          }}
          className="rounded-t-[32px] border border-border-default bg-background-primary px-5 pt-3"
        >
          <View>
            <View
              style={{ paddingBottom: insets.bottom + 16 }}
              className="pt-0"
            >
              <View
                {...panResponder.panHandlers}
                className="mb-4 items-center pb-1"
              >
                <View className="mb-4 h-1 w-10 rounded-full bg-brand-primary" />
                <Text className="font-display text-lg text-text-primary">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="mt-1 text-center font-body text-xs text-text-secondary">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {children}

              {showCancel ? (
                <Pressable
                  onPress={onClose}
                  className="mt-3 items-center rounded-2xl border border-border-default bg-surface-primary py-3.5 active:bg-surface-secondary"
                >
                  <Text className="font-body text-sm text-text-secondary">
                    Vazgeç
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
