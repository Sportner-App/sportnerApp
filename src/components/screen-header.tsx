import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { HIT_SLOP, themeColors } from "@/constants/theme";
import type { ScreenHeaderProps } from "@/types/components";

import { BrandMark } from "./brand-mark";
import { AppText as Text } from "@/components/app-text";

function HeaderSpacer() {
  return <View className="h-10 w-10" />;
}

export function ScreenHeader({
  title,
  onTitlePress,
  titleContent,
  brand = false,
  showBack = false,
  onBack,
  left,
  right,
  tone = "light",
}: ScreenHeaderProps) {
  const router = useRouter();
  const isLight = tone === "light";

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
        hitSlop={HIT_SLOP}
        onPress={handleBack}
        className={`h-10 w-10 items-center justify-center rounded-full border active:opacity-80 ${
          isLight
            ? "border-border-default bg-surface-primary"
            : "border-white/10 bg-surface-primary/90"
        }`}
      >
        <FontAwesome6
          name="arrow-left"
          size={14}
          color={isLight ? themeColors.text.primary : themeColors.text.inverse}
        />
      </Pressable>
    ) : brand ? (
      <BrandMark tone={tone} />
    ) : (
      <HeaderSpacer />
    ));

  return (
    <View className={`px-6 pb-3 ${brand ? "pt-4" : "pt-3"}`}>
      <View
        className={
          brand
            ? "flex-row items-center justify-between"
            : "flex-row items-center"
        }
      >
        <View className="flex-shrink-0">{leftSlot}</View>

        {!brand && (titleContent ?? title) ? (
          <Pressable
            disabled={!onTitlePress}
            onPress={onTitlePress}
            accessibilityRole={onTitlePress ? "button" : undefined}
            className="min-w-0 flex-1 active:opacity-70"
          >
            {titleContent ?? (
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                className={`px-3 text-center font-body-bold text-caption leading-4 tracking-[4px] ${
                  isLight ? "text-text-secondary" : "text-text-tertiary"
                }`}
              >
                {title}
              </Text>
            )}
          </Pressable>
        ) : null}

        <View className="flex-shrink-0">{right ?? <HeaderSpacer />}</View>
      </View>
    </View>
  );
}
