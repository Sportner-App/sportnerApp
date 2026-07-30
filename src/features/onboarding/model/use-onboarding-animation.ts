/**
 * Onboarding animation hook
 */

import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function useOnboardingAnimation(step: number, viewportWidth: number) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (viewportWidth <= 0) {
      return;
    }

    translateX.value = withTiming(-step * viewportWidth, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [step, translateX, viewportWidth]);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { trackAnimatedStyle };
}
