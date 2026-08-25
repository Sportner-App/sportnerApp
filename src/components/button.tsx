import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "@/types/components";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary",
  secondary: "border border-white/10 bg-brand-raised",
  outline: "border border-brand-primary/60 bg-transparent",
  ghost: "bg-transparent",
  danger: "bg-[#ef4444]",
};

const labelVariants: Record<ButtonVariant, string> = {
  primary: "text-brand-secondary",
  secondary: "text-white",
  outline: "text-brand-primary",
  ghost: "text-brand-neutral",
  danger: "text-white",
};

const containerSizes: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-4",
  md: "min-h-[52px] px-5",
  lg: "min-h-[58px] px-6",
};

const labelSizes: Record<ButtonSize, string> = {
  sm: "font-body text-sm font-semibold",
  md: "font-body text-base font-semibold",
  lg: "font-display text-base tracking-wide",
};

const contentColors: Record<ButtonVariant, string> = {
  primary: "#0f172a",
  secondary: "#f8fafc",
  outline: "#ccff00",
  ghost: "#64748b",
  danger: "#ffffff",
};

function triggerHaptic(haptic: NonNullable<ButtonProps["haptic"]>) {
  if (haptic === "success") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }

  void Haptics.impactAsync(
    haptic === "medium"
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light,
  );
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  icon,
  glow = "default",
  haptic,
  pressScale = 0.97,
  isLoading = false,
  loadingLabel,
  disabled = false,
  onPress,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isInactive = disabled || isLoading;
  const isDisabledPrimary = variant === "primary" && disabled && !isLoading;
  const hasGlow = variant === "primary" && !isInactive;
  const pressDuration = pressScale === 0.98 ? 100 : 90;
  const disabledLabelClass = isDisabledPrimary
    ? "text-brand-neutral"
    : labelVariants[variant];
  const disabledIconColor = isDisabledPrimary
    ? "#64748b"
    : contentColors[variant];

  return (
    <AnimatedPressable
      {...pressableProps}
      accessibilityRole={pressableProps.accessibilityRole ?? "button"}
      accessibilityLabel={pressableProps.accessibilityLabel ?? label}
      disabled={isInactive}
      onPress={(event) => {
        if (haptic) {
          triggerHaptic(haptic);
        }
        onPress?.(event);
      }}
      onPressIn={(event) => {
        scale.value = withTiming(pressScale, { duration: pressDuration });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, {
          duration: pressScale === 0.98 ? 100 : 140,
        });
        onPressOut?.(event);
      }}
      style={[
        animatedStyle,
        hasGlow &&
          (glow === "subtle"
            ? {
                shadowColor: "#ccff00",
                shadowOpacity: 0.18,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }
            : {
                shadowColor: "#ccff00",
                shadowOpacity: 0.4,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }),
      ]}
      className={`flex-row items-center justify-center gap-2.5 rounded-2xl ${
        isDisabledPrimary
          ? "border border-white/10 bg-brand-raised"
          : containerVariants[variant]
      } ${containerSizes[size]}`}
    >
      {isLoading ? (
        <>
          <ActivityIndicator color={contentColors[variant]} />
          {loadingLabel ? (
            <Text className={`${labelSizes[size]} ${labelVariants[variant]}`}>
              {loadingLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {icon && (
            <FontAwesome6
              name={icon}
              size={size === "sm" ? 14 : 16}
              color={disabledIconColor}
            />
          )}
          <Text className={`${labelSizes[size]} ${disabledLabelClass}`}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
