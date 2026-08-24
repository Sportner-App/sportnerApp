import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { IconName, SportLoaderProps } from "@/types/components";

const LIME = "#ccff00";
const SLATE = "#64748b";

const ORBIT_ICONS: { name: IconName; color: string }[] = [
  { name: "futbol", color: LIME },
  { name: "basketball", color: SLATE },
  { name: "volleyball", color: LIME },
  { name: "table-tennis-paddle-ball", color: SLATE },
  { name: "dumbbell", color: LIME },
  { name: "person-biking", color: SLATE },
  { name: "person-swimming", color: LIME },
  { name: "baseball-bat-ball", color: SLATE },
];

export function SportLoader({
  size = 168,
  label = "Yükleniyor",
}: SportLoaderProps) {
  const rotation = useSharedValue(0);
  const centerScale = useSharedValue(1);
  const pulseProgress = useSharedValue(0);
  const labelOpacity = useSharedValue(0.4);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
    );

    centerScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );

    pulseProgress.value = withRepeat(
      withDelay(
        200,
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      ),
      -1,
    );

    labelOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
    );
  }, [rotation, centerScale, pulseProgress, labelOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Halka dönerken ikonların dik kalması için ters yönde döndürüyoruz
  const counterRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}deg` }],
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulseProgress.value),
    transform: [{ scale: 0.55 + pulseProgress.value * 0.6 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const iconSize = size * 0.11;
  const orbitRadius = size / 2 - iconSize;
  const centerSize = size * 0.34;

  return (
    <View className="items-center gap-6">
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center"
      >
        {/* Genişleyip sönen nabız halkası */}
        <Animated.View
          style={[{ width: size, height: size }, pulseStyle]}
          className="absolute rounded-full border-2 border-brand-primary"
        />

        {/* İnce sabit halka */}
        <View
          style={{ width: size * 0.92, height: size * 0.92 }}
          className="absolute rounded-full border border-white/5"
        />

        {/* Dönen spor ikonları halkası */}
        <Animated.View
          style={[{ width: size, height: size }, ringStyle]}
          className="absolute items-center justify-center"
        >
          {ORBIT_ICONS.map((icon, index) => {
            const angle = (index / ORBIT_ICONS.length) * Math.PI * 2;

            return (
              <Animated.View
                key={icon.name}
                style={[
                  {
                    position: "absolute",
                    transform: [
                      { translateX: Math.cos(angle) * orbitRadius },
                      { translateY: Math.sin(angle) * orbitRadius },
                    ],
                  },
                ]}
              >
                <Animated.View style={counterRotateStyle}>
                  <FontAwesome6
                    name={icon.name}
                    size={iconSize}
                    color={icon.color}
                  />
                </Animated.View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Merkezdeki nabız atan koşucu */}
        <Animated.View
          style={[{ width: centerSize, height: centerSize }, centerStyle]}
          className="items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10"
        >
          <FontAwesome6
            name="person-running"
            size={centerSize * 0.45}
            color={LIME}
          />
        </Animated.View>
      </View>

      {label ? (
        <Animated.View style={labelStyle}>
          <Text className="font-mono text-xs uppercase tracking-[4px] text-brand-primary">
            {label}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
