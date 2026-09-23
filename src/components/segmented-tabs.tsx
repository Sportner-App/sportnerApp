import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { SegmentedTabsProps } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

// p-1 (4px) padding + 1px border, iki taraftan
const TRACK_INSET = 10;

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  indicatorMotion = "spring",
}: SegmentedTabsProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - TRACK_INSET) / options.length : 0;

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
      className={`relative flex-row rounded-2xl border border-border-default bg-background-secondary p-1 ${
        disabled ? "opacity-50" : ""
      }`}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
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
          accessibilityRole="tab"
          accessibilityState={{ selected: option.key === value }}
          accessibilityLabel={
            option.badge == null
              ? option.label
              : `${option.label}, ${option.badge}`
          }
          className="min-h-[44px] min-w-0 flex-1 items-center justify-center px-1"
          onPress={() => onChange(option.key)}
        >
          <Text
            numberOfLines={1}
            className={`max-w-full text-center font-body font-semibold ${
              options.length >= 4
                ? "text-overline"
                : options.length >= 3
                  ? "text-overline"
                  : "text-body-sm"
            } ${
              option.key === value
                ? "text-brand-secondary"
                : "text-brand-neutral"
            }`}
          >
            {option.label}
          </Text>
          {option.badge != null ? (
            <View
              className={`absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full px-1 ${
                option.key === value
                  ? "bg-brand-secondary/15"
                  : option.badge > 0
                    ? "bg-brand-primary/15"
                    : "bg-surface-secondary"
              }`}
            >
              <Text
                style={{ fontVariant: ["tabular-nums"] }}
                className={`font-mono text-overline leading-[10px] ${
                  option.key === value
                    ? "text-brand-secondary"
                    : option.badge > 0
                      ? "text-brand-primary"
                      : "text-text-tertiary"
                }`}
              >
                {option.badge}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
