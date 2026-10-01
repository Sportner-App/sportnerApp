import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  ReduceMotion,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { fonts, palette, themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

const SPORT_CHIPS: { icon: IconName; label: string; angle: number }[] = [
  { icon: "futbol", label: "Futbol", angle: -90 },
  { icon: "person-running", label: "Koşu", angle: 30 },
  { icon: "table-tennis-paddle-ball", label: "Tenis", angle: 150 },
];

const CHIP_START_RADIUS = 360;
const CHIP_END_RADIUS = 104;
const CHIP_ENTRY_DELAY = 100;
const CHIP_STAGGER_MS = 140;
const CHIP_ENTRY_MS = 780;
const HOLD_MS = 1650;
const EXIT_MS = 350;

function SplashSportChip({
  chip,
  index,
  orbit,
  reducedMotion,
}: {
  chip: (typeof SPORT_CHIPS)[number];
  index: number;
  orbit: SharedValue<number>;
  reducedMotion: boolean;
}) {
  // Uçuş mesafesi hareket; solma değil. Reduce motion'da chip'i son konumunda
  // başlatıp yalnızca opaklığı animasyonluyoruz.
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  const appear = useSharedValue(0);
  const radians = (chip.angle * Math.PI) / 180;

  useEffect(() => {
    const delay = CHIP_ENTRY_DELAY + index * CHIP_STAGGER_MS;

    appear.value = withDelay(
      delay,
      withTiming(1, {
        duration: CHIP_ENTRY_MS,
        reduceMotion: ReduceMotion.Never,
      }),
    );

    if (reducedMotion) {
      progress.value = 1;
      return;
    }

    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: CHIP_ENTRY_MS,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      }),
    );
  }, [appear, index, progress, reducedMotion]);

  const anchorStyle = useAnimatedStyle(() => {
    const radius =
      CHIP_START_RADIUS +
      (CHIP_END_RADIUS - CHIP_START_RADIUS) * progress.value;

    return {
      opacity: 0.18 + appear.value * 0.82,
      transform: [
        { translateX: Math.cos(radians) * radius },
        { translateY: Math.sin(radians) * radius },
        { scale: 0.9 + progress.value * 0.1 },
      ],
    };
  });

  const counterOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-orbit.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.chipAnchor, anchorStyle]}>
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
}

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const { t } = useTranslation("components");
  const reducedMotion = useReducedMotion();
  const exit = useSharedValue(0);
  const ringScale = useSharedValue(0.72);
  const ringOpacity = useSharedValue(0.45);
  const orbit = useSharedValue(0);
  const glowPulse = useSharedValue(0.55);
  /**
   * Opaklığı useAnimatedStyle ile sürülen katmanların giriş solması. `entering`
   * kullanılamaz: layout animasyonu biterken opaklığı 1'de bırakıp stili ezer.
   */
  const intro = useSharedValue(0);

  const hasFinishedRef = useRef(false);
  const finish = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    intro.value = withTiming(1, {
      duration: 500,
      reduceMotion: ReduceMotion.Never,
    });

    if (reducedMotion) {
      // Nabız ve yörünge hareketini atla, dengeli bir duruşta sabitle.
      ringScale.value = 1;
      ringOpacity.value = 0.5;
      glowPulse.value = 0.8;
    } else {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1100, easing: Easing.out(Easing.quad) }),
          withTiming(0.82, {
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
          }),
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
    }

    const timer = setTimeout(() => {
      exit.value = withTiming(
        1,
        {
          duration: EXIT_MS,
          easing: Easing.inOut(Easing.quad),
          // Çapraz geçiş reduce motion'da da güvenli; açılışın kilitlenmemesi
          // için bu animasyonun her koşulda tamamlanması gerekiyor.
          reduceMotion: ReduceMotion.Never,
        },
        (completed) => {
          if (completed) {
            runOnJS(finish)();
          }
        },
      );
    }, HOLD_MS);

    // Animasyon herhangi bir nedenle ilerlemezse kullanıcı splash'te kalmasın.
    const failsafe = setTimeout(finish, HOLD_MS + EXIT_MS + 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
    };
  }, [
    exit,
    finish,
    glowPulse,
    intro,
    orbit,
    reducedMotion,
    ringOpacity,
    ringScale,
  ]);

  // Solma her koşulda çalışsın; reduce motion'da yalnızca kaydırma/ölçek düşer.
  const enterFade = (duration: number, delay = 0) =>
    FadeIn.duration(duration).delay(delay).reduceMotion(ReduceMotion.Never);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: reducedMotion ? 1 : 1 + exit.value * 0.035 }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: intro.value * ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: intro.value * (0.16 + glowPulse.value * 0.14),
    transform: [{ scale: 0.92 + glowPulse.value * 0.12 }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.root, screenStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel={t("splash.accessibilityLabel")}
    >
      <StatusBar style="light" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="splash-glow"
              cx="50%"
              cy="42%"
              rx="58%"
              ry="48%"
            >
              <Stop offset="0" stopColor={palette.lime} stopOpacity="0.22" />
              <Stop offset="0.55" stopColor={palette.lime} stopOpacity="0.04" />
              <Stop offset="1" stopColor={palette.canvas} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={palette.canvas} />
          <Rect width="100%" height="100%" fill="url(#splash-glow)" />
        </Svg>
      </View>

      <View style={styles.decorRing} />

      <View style={styles.stage}>
        <Animated.View style={[styles.glowOrb, glowStyle]} />

        <Animated.View style={[styles.pulseRing, pulseRingStyle]} />

        <Animated.View
          entering={enterFade(420, 60)}
          style={styles.innerRing}
        />

        <Animated.View
          entering={
            reducedMotion
              ? enterFade(520)
              : FadeInUp.duration(520).springify().damping(16)
          }
          style={styles.logoMark}
        >
          <Text style={styles.logoLetter}>S</Text>
        </Animated.View>

        <Animated.View style={[styles.orbitLayer, orbitStyle]}>
          {SPORT_CHIPS.map((chip, index) => {
            return (
              <SplashSportChip
                key={chip.label}
                chip={chip}
                index={index}
                orbit={orbit}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </Animated.View>

        <Animated.View
          entering={
            reducedMotion
              ? enterFade(480, 220)
              : FadeInUp.duration(480).delay(220)
          }
          style={styles.brandRow}
        >
          <View style={styles.brandDot} />
          <Text style={styles.brandWord}>Sportner</Text>
        </Animated.View>
      </View>

      <Animated.View entering={enterFade(480, 360)} style={styles.footer}>
        <Text style={styles.tagline}>{t("splash.tagline")}</Text>
        <View style={styles.footerRule} />
        <Text style={styles.footerHint}>{t("splash.footerHint")}</Text>
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
    lineHeight: 64,
    includeFontPadding: false,
    textAlign: "center",
    color: themeColors.brand.primary,
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
    backgroundColor: `${palette.surface}f2`,
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
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.2,
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
    fontFamily: fonts.body,
    fontSize: 13,
    color: themeColors.text.secondary,
  },
});
