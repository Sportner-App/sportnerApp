import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CREATE_EVENT_LIMITS } from "@/constants/events";
import { themeColors } from "@/constants/theme";

type AgeRangeSliderProps = {
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  disabled?: boolean;
};

const MIN_AGE = CREATE_EVENT_LIMITS.participantAgeMin;
const MAX_AGE = CREATE_EVENT_LIMITS.participantAgeMax;
const THUMB_TOUCH_SIZE = 48;

function clamp(value: number, lower: number, upper: number) {
  "worklet";
  return Math.min(upper, Math.max(lower, value));
}

function valueToPosition(value: number, width: number) {
  return ((value - MIN_AGE) / (MAX_AGE - MIN_AGE)) * width;
}

function positionToValue(position: number, width: number) {
  "worklet";
  if (width <= 0) return MIN_AGE;
  return Math.round(MIN_AGE + (position / width) * (MAX_AGE - MIN_AGE));
}

export function AgeRangeSlider({
  minValue,
  maxValue,
  onChange,
  disabled = false,
}: AgeRangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [previewRange, setPreviewRange] = useState({
    min: minValue,
    max: maxValue,
  });
  const width = useSharedValue(0);
  const minPosition = useSharedValue(0);
  const maxPosition = useSharedValue(0);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    width.set(trackWidth);
    minPosition.set(valueToPosition(minValue, trackWidth));
    maxPosition.set(valueToPosition(maxValue, trackWidth));
  }, [maxPosition, maxValue, minPosition, minValue, trackWidth, width]);

  const updatePreview = (min: number, max: number) => {
    setPreviewRange((current) =>
      current.min === min && current.max === max ? current : { min, max },
    );
  };

  useAnimatedReaction(
    () => ({
      min: positionToValue(minPosition.get(), width.get()),
      max: positionToValue(maxPosition.get(), width.get()),
    }),
    (current, previous) => {
      if (current.min !== previous?.min || current.max !== previous?.max) {
        scheduleOnRN(updatePreview, current.min, current.max);
      }
    },
  );

  const commit = (nextMin: number, nextMax: number) => {
    onChange(nextMin, nextMax);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const minGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      dragStart.set(minPosition.get());
    })
    .onUpdate((event) => {
      minPosition.set(
        clamp(dragStart.get() + event.translationX, 0, maxPosition.get()),
      );
    })
    .onEnd(() => {
      scheduleOnRN(
        commit,
        positionToValue(minPosition.get(), width.get()),
        positionToValue(maxPosition.get(), width.get()),
      );
    });

  const maxGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      dragStart.set(maxPosition.get());
    })
    .onUpdate((event) => {
      maxPosition.set(
        clamp(
          dragStart.get() + event.translationX,
          minPosition.get(),
          width.get(),
        ),
      );
    })
    .onEnd(() => {
      scheduleOnRN(
        commit,
        positionToValue(minPosition.get(), width.get()),
        positionToValue(maxPosition.get(), width.get()),
      );
    });

  const selectedTrackStyle = useAnimatedStyle(() => ({
    left: minPosition.get(),
    width: Math.max(maxPosition.get() - minPosition.get(), 0),
  }));
  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minPosition.get() - THUMB_TOUCH_SIZE / 2 }],
  }));
  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxPosition.get() - THUMB_TOUCH_SIZE / 2 }],
  }));
  return (
    <View
      className={`rounded-[28px] border border-border-default bg-surface-primary p-5 ${disabled ? "opacity-50" : ""}`}
    >
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="font-body-bold text-[13px] text-text-secondary">
            Katılım yaş aralığı
          </Text>
          <Text className="mt-1 font-body text-xs text-text-tertiary">
            Tutamaçları sürükleyerek ayarla
          </Text>
        </View>
        <View className="flex-row items-center rounded-full bg-brand-primary/10 px-3 py-1.5">
          <Text className="min-w-6 text-center font-mono text-sm text-brand-primary">
            {previewRange.min}
          </Text>
          <Text className="font-mono text-sm text-brand-primary">–</Text>
          <Text className="min-w-6 text-center font-mono text-sm text-brand-primary">
            {previewRange.max}
          </Text>
          <Text className="ml-1 font-body text-xs text-brand-primary">yaş</Text>
        </View>
      </View>

      <View
        className="h-12 justify-center"
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <View className="h-2 rounded-full bg-surface-secondary" />
        <Animated.View
          pointerEvents="none"
          className="absolute top-5 h-2 rounded-full bg-brand-primary"
          style={selectedTrackStyle}
        />

        <GestureDetector gesture={minGesture}>
          <Animated.View
            accessibilityRole="adjustable"
            accessibilityLabel="Minimum katılım yaşı"
            className="absolute top-0 h-12 w-12 items-center justify-center"
            style={minThumbStyle}
          >
            <View className="h-[30px] w-[30px] rounded-full border-[5px] border-brand-primary bg-surface-primary" />
          </Animated.View>
        </GestureDetector>
        <GestureDetector gesture={maxGesture}>
          <Animated.View
            accessibilityRole="adjustable"
            accessibilityLabel="Maksimum katılım yaşı"
            className="absolute top-0 h-12 w-12 items-center justify-center"
            style={maxThumbStyle}
          >
            <View className="h-[30px] w-[30px] rounded-full border-[5px] border-brand-primary bg-surface-primary" />
          </Animated.View>
        </GestureDetector>
      </View>

      <View className="mt-1 flex-row justify-between">
        <Text
          className="font-mono text-[11px]"
          style={{ color: themeColors.text.tertiary }}
        >
          {MIN_AGE}
        </Text>
        <Text
          className="font-mono text-[11px]"
          style={{ color: themeColors.text.tertiary }}
        >
          {MAX_AGE}
        </Text>
      </View>
    </View>
  );
}
