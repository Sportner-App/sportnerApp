import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
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
  danger: "bg-[#fda4af]",
};

const labelVariants: Record<ButtonVariant, string> = {
  primary: "text-brand-secondary",
  secondary: "text-white",
  outline: "text-brand-primary",
  ghost: "text-brand-neutral",
  danger: "text-brand-secondary",
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
  danger: "#0f172a",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  disabled = false,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isInactive = disabled || isLoading;
  const hasGlow = variant === "primary" && !isInactive;

  return (
    <AnimatedPressable
      {...pressableProps}
      disabled={isInactive}
      onPressIn={(event) => {
        scale.value = withTiming(0.97, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}
      style={[
        animatedStyle,
        hasGlow && {
          shadowColor: "#ccff00",
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
      ]}
      className={`flex-row items-center justify-center gap-2.5 rounded-2xl ${containerVariants[variant]} ${containerSizes[size]} ${
        disabled && !isLoading ? "opacity-50" : ""
      }`}
    >
      {isLoading ? (
        <ActivityIndicator color={contentColors[variant]} />
      ) : (
        <>
          {icon && (
            <FontAwesome6
              name={icon}
              size={size === "sm" ? 14 : 16}
              color={contentColors[variant]}
            />
          )}
          <Text className={`${labelSizes[size]} ${labelVariants[variant]}`}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
