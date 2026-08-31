import { useIsFocused } from "@react-navigation/native";
import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { BrandMark, Button } from "@/components";
import { DARK_THEME_COLORS } from "@/constants/theme-palettes";
import { createThemeVariables } from "@/contexts/theme-preference-provider";
import type { IconName } from "@/types/components";

import { OnboardingProgress } from "./onboarding-progress";

const DARK_THEME_VARIABLES = createThemeVariables(DARK_THEME_COLORS);

type FirstLaunchScaffoldProps = {
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  visual?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryHint?: string;
  onSecondary?: () => void;
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  progressStep?: 1 | 2 | 3;
  primaryIcon?: IconName;
  primaryGlow?: "default" | "subtle";
  primaryHaptic?: "light" | "medium" | "success";
  accentLine?: number;
  embedded?: boolean;
};

export function FirstLaunchScaffold({
  title,
  subtitle,
  image,
  visual,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  secondaryHint,
  onSecondary,
  primaryLoading,
  secondaryLoading,
  progressStep,
  primaryIcon,
  primaryGlow = "subtle",
  primaryHaptic = "light",
  accentLine,
  embedded = false,
}: FirstLaunchScaffoldProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const translateX = useSharedValue(embedded ? 0 : 22);
  const reduceEnter = embedded && Platform.OS === "android";
  const overlayId = progressStep ? `intro-${progressStep}` : "welcome";

  useEffect(() => {
    if (embedded) {
      return;
    }

    translateX.value = withTiming(isFocused ? 0 : -22, {
      duration: isFocused ? 260 : 180,
    });
  }, [embedded, isFocused, translateX]);

  const transitionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      className="flex-1 bg-background-primary"
      style={[DARK_THEME_VARIABLES, embedded ? undefined : transitionStyle]}
    >
      {image ? (
        <ImageBackground
          source={image}
          resizeMode="cover"
          fadeDuration={0}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <PhotoOverlay overlayId={overlayId} />

      <View
        className="flex-1 px-6"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 18,
        }}
      >
        <BrandMark />

        {progressStep ? (
          <Animated.View
            entering={reduceEnter ? undefined : FadeInDown.duration(380)}
            className="mt-10"
          >
            <Text className="font-mono text-[28px] text-text-primary">
              0{progressStep}
            </Text>
            <View className="mt-2 h-0.5 w-7 bg-brand-primary" />
          </Animated.View>
        ) : null}

        {visual ? (
          <View
            pointerEvents="none"
            className="absolute left-6 right-6"
            style={{ top: progressStep ? insets.top + 108 : insets.top + 88 }}
          >
            {visual}
          </View>
        ) : null}

        <View className="flex-1" />

        <Animated.View
          entering={
            reduceEnter ? undefined : FadeInDown.duration(440).delay(60)
          }
        >
          <View className="gap-0.5">
            {title.split("\n").map((line, index) => (
              <Text
                key={`${line}-${index}`}
                className={`font-display text-[40px] leading-[42px] ${
                  index === accentLine
                    ? "text-brand-primary"
                    : "text-text-primary"
                }`}
              >
                {line}
              </Text>
            ))}
          </View>
          <Text className="mt-4 max-w-[310px] font-body text-[15px] leading-6 text-white/70">
            {subtitle}
          </Text>
        </Animated.View>

        <View className="mt-7">
          {progressStep ? (
            <View className="mb-5">
              <OnboardingProgress step={progressStep} />
            </View>
          ) : null}
          <View className="gap-2">
            {primaryLabel && onPrimary ? (
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
            ) : null}
            {secondaryLabel && onSecondary ? (
              <Pressable
                onPress={onSecondary}
                disabled={secondaryLoading}
                className="min-h-[48px] items-center justify-center rounded-pill border border-white/25 bg-black/15 active:opacity-75"
              >
                <Text className="font-body text-sm text-white/70">
                  {secondaryHint ? `${secondaryHint} ` : ""}
                  <Text className="font-body-bold text-white">
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

function PhotoOverlay({ overlayId }: { overlayId: string }) {
  const topId = `launch-top-${overlayId}`;
  const bottomId = `launch-bottom-${overlayId}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={topId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#06111a" stopOpacity="0.88" />
            <Stop offset="0.38" stopColor="#06111a" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#06111a" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={bottomId} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#06111a" stopOpacity="1" />
            <Stop offset="0.48" stopColor="#06111a" stopOpacity="0.78" />
            <Stop offset="0.78" stopColor="#06111a" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#06111a" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${topId})`} />
        <Rect width="100%" height="100%" fill={`url(#${bottomId})`} />
      </Svg>
      <View className="absolute -right-20 top-[18%] h-52 w-52 rounded-full border-[30px] border-brand-primary/15" />
    </View>
  );
}
