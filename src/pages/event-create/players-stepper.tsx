import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CREATE_EVENT_LIMITS } from "@/constants/events";
import { themeColors } from "@/constants/theme";

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
  const parsedValue = Number(value);
  const count =
    Number.isFinite(parsedValue) && value !== "" ? parsedValue : MIN;
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

  const typeCount = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits === "") {
      onChange("");
      return;
    }

    const normalized = String(Math.min(Number(digits), MAX));
    onChange(normalized);
  };

  const finishEditing = () => {
    const next = Math.min(MAX, Math.max(MIN, Number(value) || MIN));
    onChange(String(next));
  };

  return (
    <View className="rounded-[28px] border border-border-default bg-surface-primary p-5">
      <Text className="mb-5 text-center font-body-bold text-[13px] text-text-secondary">
        Katılımcı Kapasitesi
      </Text>
      <View className="flex-row items-center justify-between">
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
          className="h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-surface-secondary active:opacity-80 disabled:opacity-40"
        >
          <FontAwesome6
            name="minus"
            size={16}
            color={themeColors.text.primary}
          />
        </AnimatedPressable>

        <View className="items-center">
          <Animated.View style={countStyle}>
            <TextInput
              accessibilityLabel="Katılımcı kapasitesi"
              value={value}
              onChangeText={typeCount}
              onBlur={finishEditing}
              onSubmitEditing={finishEditing}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={4}
              selectTextOnFocus
              textAlign="center"
              className="min-w-[132px] p-0 font-display text-6xl leading-[64px] text-text-primary"
              selectionColor={themeColors.brand.primary}
              cursorColor={themeColors.brand.primary}
            />
          </Animated.View>
          <Text className="font-body text-sm text-text-secondary">kişi</Text>
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
          className="h-14 w-14 items-center justify-center rounded-full border border-brand-primary/50 bg-brand-primary/10 active:opacity-80 disabled:opacity-40"
        >
          <FontAwesome6
            name="plus"
            size={16}
            color={themeColors.brand.primary}
          />
        </AnimatedPressable>
      </View>

      <Text className="mt-5 text-center font-body text-xs text-text-tertiary">
        Butonları kullanabilir veya sayıya dokunup kapasiteyi yazabilirsin.
        {"\n"}Sen de katılımcı olarak sayılırsın.
      </Text>
    </View>
  );
}
