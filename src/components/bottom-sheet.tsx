import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import type { BottomSheetProps } from "@/types/components";
import { Button } from "./button";
import { AppText as Text } from "@/components/app-text";

const CLOSE_DURATION_MS = 280;
const TOP_GUTTER = 16;
const SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);

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
  footer,
  children,
}: BottomSheetProps) {
  const { t: tCommon } = useTranslation("common");
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const slideDistance = useSharedValue(windowHeight);
  const dragY = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const maxSheetHeight = Math.max(windowHeight - insets.top - TOP_GUTTER, 0);
  const reduceMotion = reducedMotion
    ? ReduceMotion.Always
    : ReduceMotion.System;

  const dismissFromGesture = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.set(0);
      progress.set(
        withSpring(1, {
          duration: 300,
          dampingRatio: 0.82,
          reduceMotion,
        }),
      );
      return;
    }

    if (!mounted) {
      return;
    }

    progress.set(
      withTiming(
        0,
        {
          duration: CLOSE_DURATION_MS,
          easing: SHEET_EASING,
          reduceMotion,
        },
        (finished) => {
          if (finished) {
            scheduleOnRN(setMounted, false);
          }
        },
      ),
    );
  }, [dragY, mounted, progress, reduceMotion, visible]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart(() => {
          dragStartY.set(dragY.get());
        })
        .onUpdate((event) => {
          dragY.set(Math.max(0, dragStartY.get() + event.translationY));
        })
        .onEnd((event) => {
          const dismissThreshold = slideDistance.get() * 0.25;
          const shouldDismiss =
            dragY.get() > dismissThreshold || event.velocityY > 1_000;

          if (shouldDismiss) {
            dragY.set(
              withSpring(
                slideDistance.get(),
                {
                  duration: 260,
                  dampingRatio: 1,
                  velocity: event.velocityY,
                  overshootClamping: true,
                  reduceMotion,
                },
                (finished) => {
                  if (finished) {
                    scheduleOnRN(dismissFromGesture);
                  }
                },
              ),
            );
            return;
          }

          dragY.set(
            withSpring(0, {
              duration: 300,
              dampingRatio: 0.8,
              velocity: event.velocityY,
              reduceMotion,
            }),
          );
        }),
    [dismissFromGesture, dragStartY, dragY, reduceMotion, slideDistance],
  );

  const backdropStyle = useAnimatedStyle(() => {
    const dragProgress = Math.min(
      dragY.get() / Math.max(slideDistance.get(), 1),
      1,
    );

    return {
      opacity: progress.get() * (1 - dragProgress),
    };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.get()) * slideDistance.get() + dragY.get(),
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable className="absolute inset-0" onPress={onClose}>
          <Animated.View
            style={backdropStyle}
            className="absolute inset-0 bg-black/70"
          />
        </Pressable>

        <Animated.View
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0) {
              slideDistance.set(height);
            }
          }}
          // Header and footer remain reachable; only the body can overflow.
          // This also reserves the top safe area for the dismiss handle.
          style={[sheetStyle, { maxHeight: maxSheetHeight }]}
          className="overflow-hidden rounded-t-[32px] border border-border-default bg-background-primary px-5 pt-3"
        >
          <View style={{ flexShrink: 1, paddingBottom: insets.bottom + 16 }}>
            <GestureDetector gesture={panGesture}>
              <View className="mb-4 items-center pb-1">
                <View className="mb-4 h-1 w-10 rounded-full bg-brand-primary" />
                <Text className="font-display text-heading-sm text-text-primary">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="mt-1 text-center font-body text-caption text-text-secondary">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </GestureDetector>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer ? <View className="mt-3">{footer}</View> : null}

            {!footer && showCancel ? (
              <View className="mt-3">
                <Button
                  label={tCommon("cancel")}
                  variant="dangerOutline"
                  size="sm"
                  onPress={onClose}
                />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
