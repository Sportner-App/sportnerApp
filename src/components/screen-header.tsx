import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { ScreenHeaderProps } from "@/types/components";

import { BrandMark } from "./brand-mark";

function HeaderSpacer() {
  return <View className="h-10 w-10" />;
}

export function ScreenHeader({
  title,
  brand = false,
  showBack = false,
  onBack,
  left,
  right,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    router.back();
  };

  const leftSlot =
    left ??
    (showBack ? (
      <Pressable
        hitSlop={8}
        onPress={handleBack}
        className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-brand-surface/90 active:opacity-80"
      >
        <FontAwesome6 name="arrow-left" size={14} color="#f8fafc" />
      </Pressable>
    ) : brand ? (
      <BrandMark />
    ) : (
      <HeaderSpacer />
    ));

  return (
    <View className={`px-6 pb-3 ${brand ? "pt-4" : "pt-3"}`}>
      <View className="flex-row items-center justify-between">
        {leftSlot}

        {!brand && title ? (
          <Text className="font-mono text-xs tracking-[4px] text-brand-neutral">
            {title}
          </Text>
        ) : null}

        {right ?? <HeaderSpacer />}
      </View>
    </View>
  );
}
