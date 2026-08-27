import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { SegmentedTabsProps } from "@/types/components";

// p-1 (4px) padding + 1px border, iki taraftan
const TRACK_INSET = 10;

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  indicatorMotion = "spring",
}: SegmentedTabsProps<T>) {
  const [segmentWidth, setSegmentWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.key === value),
  );

  const progress = useDerivedValue(() => {
    return indicatorMotion === "timing"
      ? withTiming(activeIndex, { duration: 220 })
      : withSpring(activeIndex, {
          damping: 26,
          stiffness: 260,
          overshootClamping: true,
        });
  }, [activeIndex, indicatorMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * segmentWidth }],
  }));

  return (
    <View
      className={`relative flex-row rounded-2xl border border-white/10 bg-background-primary/70 p-1 ${
        disabled ? "opacity-50" : ""
      }`}
      onLayout={(event) =>
        setSegmentWidth(
          (event.nativeEvent.layout.width - TRACK_INSET) / options.length,
        )
      }
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[indicatorStyle, { width: segmentWidth }]}
          className="absolute bottom-1 left-1 top-1 rounded-xl bg-brand-primary"
        />
      )}

      {options.map((option) => (
        <Pressable
          key={option.key}
          disabled={disabled}
          className="min-h-[44px] flex-1 items-center justify-center"
          onPress={() => onChange(option.key)}
        >
          <Text
            className={`text-center font-body font-semibold ${
              options.length >= 3 ? "text-[11px]" : "text-sm"
            } ${
              option.key === value
                ? "text-brand-secondary"
                : "text-brand-neutral"
            }`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
