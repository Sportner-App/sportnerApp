import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BottomSheet, Button } from "@/components";
import { lightImpact } from "@/utils/haptics";

type LeaveEventActionProps = {
  isLeaving: boolean;
  onLeave: () => Promise<void> | void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LeaveEventAction({ isLeaving, onLeave }: LeaveEventActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const confirmLeave = async () => {
    if (isLeaving) {
      return;
    }
    await onLeave();
    setConfirmOpen(false);
  };

  return (
    <>
      <AnimatedPressable
        accessibilityRole="button"
        disabled={isLeaving}
        onPress={() => {
          if (isLeaving) {
            return;
          }
          lightImpact();
          setConfirmOpen(true);
        }}
        onPressIn={() => {
          if (!isLeaving) {
            scale.value = withTiming(0.98, { duration: 90 });
          }
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 90 });
        }}
        style={pressStyle}
        className="flex-row items-center justify-center gap-2 py-2"
      >
        <FontAwesome6 name="arrow-right-from-bracket" size={12} color="#ef4444" />
        <Text className="font-body text-sm text-[#ef4444]">
          {isLeaving ? "Ayrılıyor..." : "Etkinlikten Ayrıl"}
        </Text>
      </AnimatedPressable>

      <BottomSheet
        visible={confirmOpen}
        onClose={() => {
          if (!isLeaving) {
            setConfirmOpen(false);
          }
        }}
        title="Etkinlikten ayrılmak istiyor musun?"
        subtitle="Katılımcı listesinden çıkarılacaksın."
      >
        <View className="mb-1">
          <Button
            label="Etkinlikten Ayrıl"
            variant="secondary"
            size="md"
            pressScale={0.98}
            isLoading={isLeaving}
            disabled={isLeaving}
            onPress={confirmLeave}
          />
        </View>
      </BottomSheet>
    </>
  );
}
