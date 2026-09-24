import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState, type ReactNode } from "react";
import {
  ImageBackground,
  Platform,
  useWindowDimensions,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark, Button } from "@/components";
import { DARK_THEME_COLORS } from "@/constants/theme-palettes";
import { createThemeVariables } from "@/contexts/theme-preference-provider";
import type { IconName } from "@/types/components";

import { OnboardingProgress } from "./onboarding-progress";
import { AppText as Text } from "@/components/app-text";

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
  progressStep?: 1 | 2 | 3 | 4;
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
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 860;
  const veryCompact = windowHeight < 720;
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
          paddingTop: insets.top + (compact ? 8 : 16),
          paddingBottom: insets.bottom + (compact ? 8 : 18),
        }}
      >
        <BrandMark />

        {progressStep ? (
          <Animated.View
            entering={reduceEnter ? undefined : FadeInDown.duration(380)}
            style={{ marginTop: compact ? 12 : 24 }}
          >
            <Text
              className={`font-mono text-text-primary ${
                compact ? "text-heading-md" : "text-heading-lg"
              }`}
            >
              0{progressStep}
            </Text>
            <View
              className="h-0.5 bg-brand-primary"
              style={{ marginTop: compact ? 4 : 8, width: compact ? 22 : 28 }}
            />
          </Animated.View>
        ) : null}

        {visual ? (
          <FittedVisual compact={compact} veryCompact={veryCompact}>
            {visual}
          </FittedVisual>
        ) : (
          <View className="flex-1" />
        )}

        <Animated.View
          entering={
            reduceEnter ? undefined : FadeInDown.duration(440).delay(60)
          }
        >
          <View className="gap-0.5">
            {title.split("\n").map((line, index) => (
              <Text
                key={`${line}-${index}`}
                className={`font-display ${
                  veryCompact
                    ? "text-heading-lg leading-[30px]"
                    : compact
                      ? "text-display leading-[38px]"
                      : "text-display leading-[42px]"
                } ${
                  index === accentLine
                    ? "text-brand-primary"
                    : "text-text-primary"
                }`}
              >
                {line}
              </Text>
            ))}
          </View>
          <Text
            className={`max-w-[330px] font-body text-white/70 ${
              veryCompact
                ? "mt-2 text-body-sm leading-5"
                : compact
                  ? "mt-3 text-body-sm leading-5"
                  : "mt-4 text-body leading-6"
            }`}
          >
            {subtitle}
          </Text>
        </Animated.View>

        <View style={{ marginTop: veryCompact ? 10 : compact ? 14 : 28 }}>
          {progressStep ? (
            <View style={{ marginBottom: compact ? 10 : 20 }}>
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
                <Text className="font-body text-body-sm text-white/70">
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

function FittedVisual({
  children,
  compact,
  veryCompact,
}: {
  children: ReactNode;
  compact: boolean;
  veryCompact: boolean;
}) {
  const [availableHeight, setAvailableHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const measured = availableHeight > 0 && contentHeight > 0;
  const scale = measured ? Math.min(1, availableHeight / contentHeight) : 1;
  const top = measured ? (availableHeight - contentHeight) / 2 : 0;

  return (
    <View
      pointerEvents="none"
      className="min-h-0 flex-1 overflow-hidden"
      style={{
        marginTop: veryCompact ? 4 : compact ? 6 : 10,
        marginBottom: veryCompact ? 4 : compact ? 8 : 12,
      }}
      onLayout={(event: LayoutChangeEvent) => {
        setAvailableHeight(event.nativeEvent.layout.height);
      }}
    >
      <View
        onLayout={(event: LayoutChangeEvent) => {
          setContentHeight(event.nativeEvent.layout.height);
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top,
          opacity: measured ? 1 : 0,
          transform: [{ scale }],
        }}
      >
        {children}
      </View>
    </View>
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
