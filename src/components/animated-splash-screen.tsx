import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { palette, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

const SPORT_CHIPS: { icon: IconName; label: string; angle: number }[] = [
  { icon: "futbol", label: "Futbol", angle: -58 },
  { icon: "person-running", label: "Koşu", angle: 12 },
  { icon: "table-tennis-paddle-ball", label: "Tenis", angle: 148 },
];

const HOLD_MS = 1650;
const EXIT_MS = 460;

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const exit = useSharedValue(0);
  const ringScale = useSharedValue(0.72);
  const ringOpacity = useSharedValue(0.45);
  const orbit = useSharedValue(0);
  const glowPulse = useSharedValue(0.55);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(0.82, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: 1100 }),
        withTiming(0.28, { duration: 1100 }),
      ),
      -1,
      true,
    );

    orbit.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1,
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.62, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    const timer = setTimeout(() => {
      exit.value = withTiming(
        1,
        { duration: EXIT_MS, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        },
      );
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [exit, glowPulse, onFinish, orbit, ringOpacity, ringScale]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.035 }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + glowPulse.value * 0.14,
    transform: [{ scale: 0.92 + glowPulse.value * 0.12 }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value}deg` }],
  }));

  const counterOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-orbit.value}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.root, screenStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Sportner yükleniyor"
    >
      <StatusBar style="light" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="splash-glow" cx="50%" cy="42%" rx="58%" ry="48%">
              <Stop offset="0" stopColor={palette.lime} stopOpacity="0.22" />
              <Stop offset="0.55" stopColor={palette.lime} stopOpacity="0.04" />
              <Stop offset="1" stopColor={palette.navy} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={palette.navy} />
          <Rect width="100%" height="100%" fill="url(#splash-glow)" />
        </Svg>
      </View>

      <View style={styles.decorRing} />

      <View style={styles.stage}>
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.glowOrb, glowStyle]}
        />

        <Animated.View
          entering={FadeIn.duration(420).delay(60)}
          style={[styles.pulseRing, pulseRingStyle]}
        />

        <Animated.View
          entering={FadeIn.duration(420).delay(60)}
          style={styles.innerRing}
        />

        <Animated.View
          entering={FadeInUp.duration(520).springify().damping(16)}
          style={styles.logoMark}
        >
          <Text style={styles.logoLetter}>S</Text>
        </Animated.View>

        <Animated.View style={[styles.orbitLayer, orbitStyle]}>
          {SPORT_CHIPS.map((chip, index) => {
            const radians = (chip.angle * Math.PI) / 180;
            const radius = 118;

            return (
              <Animated.View
                key={chip.label}
                entering={FadeInDown.duration(420).delay(180 + index * 70)}
                style={[
                  styles.chipAnchor,
                  {
                    transform: [
                      { translateX: Math.cos(radians) * radius },
                      { translateY: Math.sin(radians) * radius },
                    ],
                  },
                ]}
              >
                <Animated.View style={counterOrbitStyle}>
                  <View style={styles.chip}>
                    <FontAwesome6
                      name={chip.icon}
                      size={11}
                      color={themeColors.brand.primary}
                    />
                    <Text style={styles.chipLabel}>{chip.label}</Text>
                  </View>
                </Animated.View>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(480).delay(220)}
          style={styles.brandRow}
        >
          <View style={styles.brandDot} />
          <Text style={styles.brandWord}>SPORTNER</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.duration(480).delay(360)} style={styles.footer}>
        <Text style={styles.tagline}>Spor birleştirir.</Text>
        <View style={styles.footerRule} />
        <Text style={styles.footerHint}>Harekete geç.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  decorRing: {
    position: "absolute",
    top: "18%",
    right: -72,
    width: 208,
    height: 208,
    borderRadius: 999,
    borderWidth: 28,
    borderColor: `${themeColors.brand.primary}24`,
  },
  stage: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    width: 248,
    height: 248,
    borderRadius: 999,
    backgroundColor: themeColors.brand.primary,
  },
  pulseRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: `${themeColors.brand.primary}66`,
  },
  innerRing: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${themeColors.brand.primary}22`,
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${themeColors.brand.primary}55`,
    backgroundColor: `${themeColors.brand.primary}18`,
  },
  logoLetter: {
    fontFamily: "Anybody_700Bold",
    fontSize: 54,
    color: themeColors.brand.primary,
    marginTop: -2,
  },
  orbitLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  chipAnchor: {
    position: "absolute",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: `${palette.parchment}f2`,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
    color: themeColors.text.primary,
  },
  brandRow: {
    position: "absolute",
    bottom: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: themeColors.brand.primary,
  },
  brandWord: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 16,
    letterSpacing: 9,
    color: "rgba(244,246,242,0.88)",
  },
  footer: {
    position: "absolute",
    bottom: 56,
    alignItems: "center",
    gap: 10,
  },
  tagline: {
    fontFamily: "Anybody_600SemiBold",
    fontSize: 22,
    color: themeColors.text.primary,
    letterSpacing: 0.2,
  },
  footerRule: {
    width: 28,
    height: 2,
    borderRadius: 999,
    backgroundColor: themeColors.brand.primary,
  },
  footerHint: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 11,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: themeColors.text.secondary,
  },
});
