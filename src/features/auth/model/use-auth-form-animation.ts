/**
 * Auth form animation hook
 */

import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function useAuthFormAnimation(isLogin: boolean, viewportWidth: number) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (viewportWidth <= 0) {
      return;
    }

    const activeIndex = isLogin ? 0 : 1;
    translateX.value = withTiming(-activeIndex * viewportWidth, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [isLogin, translateX, viewportWidth]);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { trackAnimatedStyle };
}
