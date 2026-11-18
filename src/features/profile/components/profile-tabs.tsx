import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { themeColors } from "@/constants/theme";
import type { IconName } from "@/types/components";

export type ProfileTabOption<T extends string> = {
  key: T;
  icon: IconName;
  /** Görünmüyor; ekran okuyucu için. */
  label: string;
};

type ProfileTabsProps<T extends string> = {
  options: ProfileTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Instagram tarzı profil sekmeleri: yalnızca ikon, ekran kenarından kenarına
 * uzanan ince bir çizginin üstünde; seçili sekmenin altında vurgu çizgisi.
 * Sayfanın yatay boşluğunu (px-5) negatif marjla aşıyor.
 */
export function ProfileTabs<T extends string>({
  options,
  value,
  onChange,
}: ProfileTabsProps<T>) {
  const [width, setWidth] = useState(0);
  const segment = options.length > 0 ? width / options.length : 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.key === value),
  );

  // Gösterge dokunuş anında, React render'ını beklemeden kayar; konum
  // indeks cinsinden tutulduğu için genişlik değişince de doğru kalır.
  const progress = useSharedValue(activeIndex);
  const target = useSharedValue(activeIndex);
  const animateTo = (index: number) => {
    target.set(index);
    progress.set(withTiming(index, { duration: 220 }));
  };

  // Seçim dışarıdan değişirse (ör. bildirimden açılış) göstergeyi eşitle.
  useEffect(() => {
    if (target.get() !== activeIndex) animateTo(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * segment }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className="-mx-5 -mb-2 flex-row border-b border-border-default"
    >
      {options.map((option, index) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              animateTo(index);
              void Haptics.selectionAsync();
              onChange(option.key);
            }}
            className="flex-1 items-center py-3.5 active:opacity-70"
          >
            <FontAwesome6
              name={option.icon}
              size={18}
              color={
                selected ? themeColors.text.primary : themeColors.text.tertiary
              }
            />
          </Pressable>
        );
      })}

      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[{ width: segment }, indicatorStyle]}
          className="absolute -bottom-px left-0 items-center"
        >
          <View className="h-0.5 w-10 rounded-full bg-brand-primary" />
        </Animated.View>
      ) : null}
    </View>
  );
}
