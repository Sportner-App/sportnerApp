import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  interpolateColor,
  Keyframe,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colorPalette } from "@/constants/colors";
import type { InputProps } from "@/types/components";

const ERROR_COLOR = colorPalette.warning;
const FOCUS_COLOR = colorPalette.primary;
const IDLE_COLOR = colorPalette.neutral;
const IDLE_BORDER = "rgba(148,163,184,0.22)";
const ACCENT_DURATION = 160;

const errorEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -4 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
}).duration(150);

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
  const errorProgress = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const hasError = Boolean(error);
  const iconColor = hasError
    ? ERROR_COLOR
    : isFocused
      ? FOCUS_COLOR
      : IDLE_COLOR;

  useEffect(() => {
    errorProgress.value = withTiming(hasError ? 1 : 0, {
      duration: ACCENT_DURATION,
    });
  }, [errorProgress, hasError]);

  const containerStyle = useAnimatedStyle(() => {
    const focusedBorder = interpolateColor(
      focusProgress.value,
      [0, 1],
      [IDLE_BORDER, FOCUS_COLOR],
    );

    return {
      borderColor: interpolateColor(
        errorProgress.value,
        [0, 1],
        [focusedBorder, ERROR_COLOR],
      ),
    };
  });

  return (
    <View className={disabled ? "opacity-50" : undefined}>
      {label && (
        <Text className="mb-2 font-body text-sm text-brand-neutral">
          {label}
        </Text>
      )}

      <Animated.View
        style={containerStyle}
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
            focusProgress.value = withTiming(1, { duration: ACCENT_DURATION });
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            focusProgress.value = withTiming(0, { duration: ACCENT_DURATION });
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
              color={iconColor}
            />
          </Pressable>
        )}
      </Animated.View>

      {hasError || helperText ? (
        <Animated.View layout={LinearTransition.duration(150)}>
          {hasError ? (
            <Animated.Text
              key={error}
              entering={errorEntering}
              className="mt-2 font-body text-sm text-[#fda4af]"
            >
              {error}
            </Animated.Text>
          ) : (
            <Text className="mt-2 font-body text-sm text-brand-neutral">
              {helperText}
            </Text>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}
