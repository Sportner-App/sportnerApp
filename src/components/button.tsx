import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable } from "react-native";
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
import { themeColors } from "@/constants/theme";
import { AppText as Text } from "@/components/app-text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary/90",
  secondary: "border border-border-strong bg-surface-secondary",
  outline: "border border-brand-primary/60 bg-brand-primary/[0.04]",
  ghost: "bg-transparent",
  danger: "bg-[#ef4444]",
  dangerOutline: "border border-[#ef4444]/70 bg-[#ef4444]/[0.08]",
};

const labelVariants: Record<ButtonVariant, string> = {
  primary: "text-background-primary",
  secondary: "text-text-primary",
  outline: "text-brand-primary",
  ghost: "text-text-secondary",
  danger: "text-white",
  dangerOutline: "text-[#f87171]",
};

const containerSizes: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-4",
  md: "min-h-[52px] px-5",
  lg: "min-h-[58px] px-6",
};

const labelSizes: Record<ButtonSize, string> = {
  sm: "font-body-bold text-body-sm",
  md: "font-body-bold text-body",
  lg: "font-display text-body tracking-wide",
};

const contentColors: Record<ButtonVariant, string> = {
  primary: themeColors.background.primary,
  secondary: themeColors.text.primary,
  outline: themeColors.brand.primary,
  ghost: themeColors.text.secondary,
  danger: themeColors.text.inverse,
  dangerOutline: "#f87171",
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
    ? "text-text-tertiary"
    : labelVariants[variant];
  const disabledIconColor = isDisabledPrimary
    ? themeColors.text.tertiary
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
                shadowColor: themeColors.brand.primary,
                shadowOpacity: 0.1,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
            : {
                shadowColor: themeColors.brand.primary,
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }),
      ]}
      className={`flex-row items-center justify-center gap-2.5 rounded-2xl ${
        isDisabledPrimary
          ? "border border-white/10 bg-surface-secondary"
          : containerVariants[variant]
      } ${containerSizes[size]}`}
    >
      {isLoading ? (
        <>
          <ActivityIndicator color={contentColors[variant]} />
          {loadingLabel ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              className={`shrink ${labelSizes[size]} ${labelVariants[variant]}`}
            >
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
          {/* Dar butonlarda (ör. SubmitBar ikili düzeni) etiket iki satıra düşmesin. */}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            className={`shrink ${labelSizes[size]} ${disabledLabelClass}`}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
