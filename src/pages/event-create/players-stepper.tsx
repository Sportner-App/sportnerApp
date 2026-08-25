import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CREATE_EVENT_LIMITS } from "@/constants/events";

type PlayersStepperProps = {
  value: string;
  onChange: (value: string) => void;
};

const MIN = CREATE_EVENT_LIMITS.maxParticipantsMin;
const MAX = CREATE_EVENT_LIMITS.maxParticipantsMax;
const PRESS_MS = 80;
const COUNT_MS = 60;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlayersStepper({ value, onChange }: PlayersStepperProps) {
  const count = Number(value) || MIN;
  const minusScale = useSharedValue(1);
  const plusScale = useSharedValue(1);
  const countScale = useSharedValue(1);

  const minusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: minusScale.value }],
  }));
  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plusScale.value }],
  }));
  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const bump = (delta: number) => {
    const next = Math.min(MAX, Math.max(MIN, count + delta));
    if (next === count) {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    countScale.value = withTiming(1.04, { duration: COUNT_MS }, (finished) => {
      if (finished) {
        countScale.value = withTiming(1, { duration: COUNT_MS });
      }
    });
    onChange(String(next));
  };

  return (
    <View>
      <View className="flex-row items-center justify-between px-2">
        <AnimatedPressable
          hitSlop={8}
          onPress={() => bump(-1)}
          disabled={count <= MIN}
          onPressIn={() => {
            if (count > MIN) {
              minusScale.value = withTiming(0.94, { duration: PRESS_MS });
            }
          }}
          onPressOut={() => {
            minusScale.value = withTiming(1, { duration: PRESS_MS });
          }}
          style={minusStyle}
          className="h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 active:opacity-80 disabled:opacity-40"
        >
          <FontAwesome6 name="minus" size={16} color="#f8fafc" />
        </AnimatedPressable>

        <View className="items-center">
          <Animated.View style={countStyle}>
            <Text className="font-display text-6xl leading-[64px] text-white">
              {count}
            </Text>
          </Animated.View>
          <Text className="font-body text-sm text-brand-neutral">kişi</Text>
        </View>

        <AnimatedPressable
          hitSlop={8}
          onPress={() => bump(1)}
          disabled={count >= MAX}
          onPressIn={() => {
            if (count < MAX) {
              plusScale.value = withTiming(0.94, { duration: PRESS_MS });
            }
          }}
          onPressOut={() => {
            plusScale.value = withTiming(1, { duration: PRESS_MS });
          }}
          style={plusStyle}
          className="h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 active:opacity-80 disabled:opacity-40"
        >
          <FontAwesome6 name="plus" size={16} color="#f8fafc" />
        </AnimatedPressable>
      </View>

      <Text className="mt-4 text-center font-body text-xs text-brand-neutral">
        Sen de katılımcı olarak sayılırsın.
      </Text>
    </View>
  );
}
