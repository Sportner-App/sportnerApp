import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

type EventCreateProgressProps = {
  step: 1 | 2 | 3;
};

const STEPS = [1, 2, 3] as const;
const LIME = "#ccff00";
const MUTED = "#64748b";
const NUMBER_MS = 220;
const FILL_MS = 240;

const AnimatedText = Animated.createAnimatedComponent(Text);

function StepNumber({
  item,
  progress,
}: {
  item: 1 | 2 | 3;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [item - 0.55, item, item + 0.55],
      [MUTED, LIME, MUTED],
    ),
  }));

  return (
    <AnimatedText
      style={style}
      className="font-mono text-[11px] tracking-wide"
    >
      {String(item).padStart(2, "0")}
    </AnimatedText>
  );
}

function Connector({
  fillsAt,
  progress,
}: {
  fillsAt: 2 | 3;
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [fillsAt - 1, fillsAt],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View className="mx-1.5 h-px flex-1 overflow-hidden bg-brand-neutral/40">
      <Animated.View
        style={[
          fillStyle,
          {
            height: 1,
            backgroundColor: "rgba(204,255,0,0.7)",
            transformOrigin: "left",
          },
        ]}
        className="w-full"
      />
    </View>
  );
}

export function EventCreateProgress({ step }: EventCreateProgressProps) {
  const progress = useSharedValue(step);

  useEffect(() => {
    progress.value = withTiming(step, { duration: NUMBER_MS });
  }, [progress, step]);

  return (
    <View className="w-full flex-row items-center">
      {STEPS.map((item, index) => (
        <View
          key={item}
          className={`flex-row items-center ${index > 0 ? "flex-1" : ""}`}
        >
          {index > 0 ? (
            <Connector
              fillsAt={item as 2 | 3}
              progress={progress}
            />
          ) : null}
          <StepNumber item={item} progress={progress} />
        </View>
      ))}
    </View>
  );
}
