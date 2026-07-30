import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type PillOption = {
  key: string;
  label: string;
};

type ActivePillSwitchProps = {
  options: PillOption[];
  value: string;
  onChange: (key: string) => void;
};

const PILL_HORIZONTAL_INSET = 4;
const PILL_VERTICAL_INSET = 4;
const ANIMATION_DURATION = 220;

export function ActivePillSwitch({
  options,
  value,
  onChange,
}: ActivePillSwitchProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = useMemo(() => {
    const foundIndex = options.findIndex((option) => option.key === value);
    return foundIndex === -1 ? 0 : foundIndex;
  }, [options, value]);

  const cellWidth =
    options.length > 0 ? containerWidth / options.length : containerWidth;
  const pillWidth = Math.max(cellWidth - PILL_HORIZONTAL_INSET * 2, 0);
  const targetX = cellWidth * activeIndex + PILL_HORIZONTAL_INSET;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (cellWidth <= 0) {
      return;
    }

    translateX.value = withTiming(targetX, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [cellWidth, targetX, translateX]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: pillWidth,
  }));

  return (
    <View
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      className="mb-4 rounded-2xl bg-brand-secondary p-1"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: PILL_VERTICAL_INSET,
            bottom: PILL_VERTICAL_INSET,
            left: 0,
            borderRadius: 14,
            backgroundColor: "#ccff00",
          },
          animatedPillStyle,
        ]}
      />

      <View className="flex-row">
        {options.map((option) => {
          const isActive = option.key === value;

          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              className="min-h-[48px] flex-1 items-center justify-center rounded-2xl"
            >
              <Text
                className={`font-body text-sm font-semibold ${
                  isActive ? "text-brand-secondary" : "text-brand-neutral"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
