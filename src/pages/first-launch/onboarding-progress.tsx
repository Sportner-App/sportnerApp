import { useEffect } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type OnboardingProgressProps = {
  step: 1 | 2 | 3 | 4;
};

const SLOT = 24;
const HEIGHT = 8;
const DOT = 6;
const LINE = 16;
const GAP = 8;
const PITCH = SLOT + GAP + LINE + GAP;
const STEPS = [1, 2, 3, 4] as const;
const TRACK = SLOT * STEPS.length + (GAP + LINE + GAP) * (STEPS.length - 1);
const DURATION_MS = 220;

let lastProgressStep: 1 | 2 | 3 | 4 = 1;

function xForStep(step: 1 | 2 | 3 | 4) {
  return (step - 1) * PITCH;
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  const { t } = useTranslation("firstLaunch");
  const translateX = useSharedValue(xForStep(lastProgressStep));

  useEffect(() => {
    translateX.value = withTiming(xForStep(step), { duration: DURATION_MS });
    lastProgressStep = step;
  }, [step, translateX]);

  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      accessible
      accessibilityRole="none"
      accessibilityLabel={t("progress.stepLabel", { step })}
      className="items-center py-1"
    >
      <View style={{ width: TRACK, height: HEIGHT }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {STEPS.map((index) => (
            <View
              key={index}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View
                style={{
                  width: SLOT,
                  height: HEIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: DOT,
                    height: DOT,
                    borderRadius: DOT / 2,
                    backgroundColor: "rgba(255,255,255,0.25)",
                  }}
                />
              </View>
              {index < STEPS.length ? (
                <View
                  style={{
                    width: GAP + LINE + GAP,
                    height: HEIGHT,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: LINE,
                      height: 1,
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              width: SLOT,
              height: HEIGHT,
              borderRadius: 999,
              backgroundColor: "#ccff00",
            },
            activeStyle,
          ]}
        />
      </View>
    </View>
  );
}
