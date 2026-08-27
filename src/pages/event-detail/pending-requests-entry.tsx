import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { themeColors } from "@/constants/theme";
import { lightImpact } from "@/utils/haptics";

type PendingRequestsEntryProps = {
  count: number;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PendingRequestsHeaderAction({
  count,
  onPress,
}: PendingRequestsEntryProps) {
  const pressScale = useSharedValue(1);
  const countScale = useSharedValue(1);
  const previousCount = useRef(count);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  useEffect(() => {
    if (previousCount.current === count) {
      return;
    }
    previousCount.current = count;
    countScale.value = withTiming(1.08, { duration: 70 }, (finished) => {
      if (finished) {
        countScale.value = withTiming(1, { duration: 70 });
      }
    });
  }, [count, countScale]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${count} bekleyen katılım isteği`}
      hitSlop={8}
      onPress={() => {
        lightImpact();
        onPress();
      }}
      onPressIn={() => {
        pressScale.value = withTiming(0.94, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 90 });
      }}
      style={[pressStyle, { backgroundColor: themeColors.overlay.dark }]}
      className="h-11 w-11 items-center justify-center rounded-full"
    >
      <FontAwesome6
        name="user-group"
        size={13}
        color={themeColors.text.inverse}
      />
      <Animated.View
        style={countStyle}
        className="absolute -right-0.5 -top-0.5 min-h-[16px] min-w-[16px] items-center justify-center rounded-pill px-1"
      >
        <View
          className="min-h-[16px] min-w-[16px] items-center justify-center rounded-pill px-1"
          style={{ backgroundColor: themeColors.brand.primary }}
        >
          <Text
            className="font-body-bold text-[10px]"
            style={{ color: themeColors.text.onPrimary }}
          >
            {count}
          </Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function PendingRequestsBanner({
  count,
  onPress,
}: PendingRequestsEntryProps) {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={() => {
        lightImpact();
        onPress();
      }}
      onPressIn={() => {
        pressScale.value = withTiming(0.985, { duration: 95 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 95 });
      }}
      style={pressStyle}
      className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3"
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15">
        <FontAwesome6 name="user-group" size={12} color="#ccff00" />
      </View>
      <Text className="flex-1 font-body text-sm text-white">
        <Text className="font-mono text-brand-primary">{count}</Text>
        {" "}
        katılım isteği bekliyor
      </Text>
      <FontAwesome6 name="chevron-right" size={12} color="#64748b" />
    </AnimatedPressable>
  );
}
