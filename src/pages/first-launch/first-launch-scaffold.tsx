import { useIsFocused } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark, Button } from "@/components";
import { AnimatedBackground } from "@/pages/auth/animated-background";
import type { IconName } from "@/types/components";

import { OnboardingProgress } from "./onboarding-progress";

const TRANSITION = {
  shift: 24,
  enterMs: 240,
  exitMs: 180,
} as const;

const LAYOUT = {
  pageX: "px-6",
  topExtra: 16,
  bottomExtra: 20,
  brandToVisual: 80,
  visualToText: 112,
  textToActions: 16,
  progressToCta: 20,
} as const;

type FirstLaunchScaffoldProps = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryHint?: string;
  onSecondary?: () => void;
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  visual?: ReactNode;
  progressStep?: 1 | 2 | 3;
  primaryIcon?: IconName;
  primaryGlow?: "default" | "subtle";
  primaryHaptic?: "light" | "medium" | "success";
};

export function FirstLaunchScaffold({
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  secondaryHint,
  onSecondary,
  primaryLoading,
  secondaryLoading,
  visual,
  progressStep,
  primaryIcon,
  primaryGlow = "subtle",
  primaryHaptic = "light",
}: FirstLaunchScaffoldProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const translateX = useSharedValue<number>(TRANSITION.shift);

  useEffect(() => {
    translateX.value = withTiming(isFocused ? 0 : -TRANSITION.shift, {
      duration: isFocused ? TRANSITION.enterMs : TRANSITION.exitMs,
    });
  }, [isFocused, translateX]);

  const transitionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View className="flex-1 bg-brand-secondary" style={transitionStyle}>
      <View
        className={`flex-1 ${LAYOUT.pageX}`}
        style={{
          paddingTop: insets.top + LAYOUT.topExtra,
          paddingBottom: insets.bottom + LAYOUT.bottomExtra,
        }}
      >
      <AnimatedBackground />

      <BrandMark />

      {visual ? (
        <View style={{ marginTop: LAYOUT.brandToVisual }}>{visual}</View>
      ) : (
        <View className="flex-1" />
      )}

      <Animated.View
        entering={FadeInDown.duration(420).delay(80)}
        className="gap-2.5"
        style={{ marginTop: LAYOUT.visualToText }}
      >
        <Text className="font-display text-[40px] leading-[40px] text-white">
          {title}
        </Text>
        <Text className="font-body text-base leading-6 text-white/60">
          {subtitle}
        </Text>
      </Animated.View>

      <View className="flex-1" />

      <View style={{ marginTop: LAYOUT.textToActions }}>
        {progressStep ? (
          <View style={{ marginBottom: LAYOUT.progressToCta }}>
            <OnboardingProgress step={progressStep} />
          </View>
        ) : null}
        <View className="gap-1">
          <Button
            label={primaryLabel}
            size="lg"
            icon={primaryIcon}
            glow={primaryGlow}
            haptic={primaryHaptic}
            pressScale={0.98}
            onPress={onPrimary}
            isLoading={primaryLoading}
          />
          {secondaryLabel && onSecondary ? (
            <Pressable
              onPress={onSecondary}
              disabled={secondaryLoading}
              accessibilityRole="button"
              accessibilityLabel={
                secondaryHint
                  ? `${secondaryHint} ${secondaryLabel}`
                  : secondaryLabel
              }
              className="min-h-[44px] items-center justify-center"
            >
              <Text className="text-center font-body text-sm text-brand-neutral">
                {secondaryHint ? `${secondaryHint} ` : ""}
                <Text className="font-semibold text-white">
                  {secondaryLabel}
                </Text>
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
    </Animated.View>
  );
}
