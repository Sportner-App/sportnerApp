import { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { LinearRefreshBarProps } from "@/types/components";

/**
 * Header altına oturan, full-width neon lime çizgisel refresh bar.
 * Kısa yenilemelerde de net görünsün diye dolu renk + hafif nabız.
 */
export function LinearRefreshBar({ visible }: LinearRefreshBarProps) {
  const reveal = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: 140 });

    if (!visible) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(0.55, {
          duration: 420,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 420,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [visible, reveal, pulse]);

  const trackStyle = useAnimatedStyle(() => ({
    opacity: reveal.value * pulse.value,
    height: reveal.value * 2,
  }));

  return (
    <Animated.View style={trackStyle} className="w-full bg-brand-primary" />
  );
}
