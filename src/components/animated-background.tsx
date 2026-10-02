import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

type GlowBlobProps = {
  id: string;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  driftX: number;
  driftY: number;
  style: ViewStyle;
};

function GlowBlob({
  id,
  size,
  color,
  opacity,
  duration,
  driftX,
  driftY,
  style,
}: GlowBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, driftY]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.18]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute" }, style, animatedStyle]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="65%" stopColor={color} stopOpacity={opacity * 0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

function OrbitRing({ size, style }: { size: number; style: ViewStyle }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 42000, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute" }, style, animatedStyle]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          stroke="rgba(204,255,0,0.14)"
          strokeWidth={1.5}
          strokeDasharray="3 16"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

export function AnimatedBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <GlowBlob
        id="auth-glow-lime"
        size={430}
        color="#ccff00"
        opacity={0.16}
        duration={9000}
        driftX={42}
        driftY={64}
        style={{ top: -170, left: -130 }}
      />
      <GlowBlob
        id="auth-glow-teal"
        size={380}
        color="#5eead4"
        opacity={0.12}
        duration={11500}
        driftX={-56}
        driftY={-44}
        style={{ bottom: -150, right: -120 }}
      />
      <GlowBlob
        id="auth-glow-indigo"
        size={300}
        color="#818cf8"
        opacity={0.1}
        duration={13500}
        driftX={34}
        driftY={-52}
        style={{ top: "36%", right: -160 }}
      />
      <OrbitRing size={340} style={{ top: -90, right: -110 }} />
    </View>
  );
}
