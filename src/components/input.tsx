import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { InputProps } from "@/types/components";

const ERROR_COLOR = "#fda4af";
const FOCUS_COLOR = "#ccff00";
const IDLE_COLOR = "#64748b";

export function Input({
  label,
  helperText,
  error,
  icon,
  isPassword = false,
  disabled = false,
  onFocus,
  onBlur,
  ...inputProps
}: InputProps) {
  const focusProgress = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const hasError = Boolean(error);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ["rgba(148,163,184,0.22)", FOCUS_COLOR],
    ),
    shadowOpacity: focusProgress.value * 0.3,
  }));

  const iconColor = hasError
    ? ERROR_COLOR
    : isFocused
      ? FOCUS_COLOR
      : IDLE_COLOR;

  return (
    <View className={disabled ? "opacity-50" : undefined}>
      {label && (
        <Text className="mb-2 font-body text-sm text-brand-neutral">
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          containerStyle,
          {
            shadowColor: hasError ? ERROR_COLOR : FOCUS_COLOR,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          },
          hasError && { borderColor: ERROR_COLOR, shadowOpacity: 0.25 },
        ]}
        className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border bg-brand-secondary/70 px-4"
      >
        {icon && <FontAwesome6 name={icon} size={16} color={iconColor} />}

        <TextInput
          {...inputProps}
          editable={!disabled && inputProps.editable !== false}
          secureTextEntry={isPassword && isHidden}
          placeholderTextColor={IDLE_COLOR}
          className="flex-1 font-body text-base text-white"
          onFocus={(event) => {
            setIsFocused(true);
            focusProgress.value = withTiming(1, { duration: 180 });
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            focusProgress.value = withTiming(0, { duration: 240 });
            onBlur?.(event);
          }}
        />

        {isPassword && (
          <Pressable
            hitSlop={10}
            onPress={() => setIsHidden((value) => !value)}
          >
            <FontAwesome6
              name={isHidden ? "eye-slash" : "eye"}
              size={16}
              color={IDLE_COLOR}
            />
          </Pressable>
        )}
      </Animated.View>

      {hasError ? (
        <Animated.Text
          key={error}
          entering={FadeInDown.duration(200)}
          className="mt-2 font-body text-sm text-[#fda4af]"
        >
          {error}
        </Animated.Text>
      ) : helperText ? (
        <Text className="mt-2 font-body text-sm text-brand-neutral">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
