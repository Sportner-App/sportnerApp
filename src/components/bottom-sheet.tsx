import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
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

const CLOSE_DURATION_MS = 260;
const SHEET_SLIDE_DISTANCE = 320;

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

  useEffect(() => {
    if (visible) {
      setMounted(true);
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
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [mounted, progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [
      {
        translateY: (1 - progress.value) * SHEET_SLIDE_DISTANCE,
      },
      {
        scale: 0.985 + progress.value * 0.015,
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
            className="absolute inset-0 bg-black/60"
          />
        </Pressable>

        <Animated.View
          style={sheetStyle}
          className="rounded-t-[28px] border border-white/10 bg-brand-surface px-5 pt-4"
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View
              style={{ paddingBottom: insets.bottom + 16 }}
              className="pt-0"
            >
              <View className="mb-4 items-center">
                <View className="mb-4 h-1 w-10 rounded-full bg-white/15" />
                <Text className="font-display text-lg text-white">{title}</Text>
                {subtitle ? (
                  <Text className="mt-1 text-center font-body text-xs text-brand-neutral">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {children}

              {showCancel ? (
                <Pressable
                  onPress={onClose}
                  className="mt-3 items-center rounded-2xl border border-white/10 py-3.5 active:opacity-80"
                >
                  <Text className="font-body text-sm text-brand-neutral">
                    Vazgeç
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
