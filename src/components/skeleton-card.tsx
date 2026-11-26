import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { radius, themeColors } from "@/constants/theme";

type SkeletonCardProps = {
  height?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Yüklenen kartın yerini tutan, yavaş nabız atan iskelet. */
export function SkeletonCard({
  height = 210,
  className,
  style,
}: SkeletonCardProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, reduceMotion: ReduceMotion.System }),
      -1,
      true,
      undefined,
      ReduceMotion.System,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={className}
      style={[
        {
          height,
          borderRadius: radius.xl,
          backgroundColor: themeColors.surface.secondary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
