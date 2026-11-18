import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { SegmentedTabsProps } from "@/types/components";
import { AppText as Text } from "@/components/app-text";

// p-1 (4px) padding + 1px border, iki taraftan
const TRACK_INSET = 10;

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  indicatorMotion = "spring",
  badgePlacement = "inline",
  translucent = false,
}: SegmentedTabsProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - TRACK_INSET) / options.length : 0;

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.key === value),
  );

  // Gösterge dokunuş anında, React render'ını beklemeden UI thread'de kayar.
  // Önceden animasyon commit'e bağlıydı: sekme değişimi ağır bir render
  // tetiklediğinde gösterge o iş bitene kadar yerinde duruyordu.
  const progress = useSharedValue(activeIndex);
  const target = useSharedValue(activeIndex);

  const animateTo = (index: number) => {
    target.set(index);
    progress.set(
      indicatorMotion === "timing"
        ? withTiming(index, { duration: 220 })
        : withSpring(index, {
            damping: 26,
            stiffness: 260,
            overshootClamping: true,
          }),
    );
  };

  // Seçim dışarıdan değişirse (ör. route param ile açılış) göstergeyi eşitle.
  useEffect(() => {
    if (target.get() !== activeIndex) animateTo(activeIndex);
    // animateTo her render'da yeniden oluşuyor; yalnızca indeks değişimi önemli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * segmentWidth }],
  }));

  return (
    <View
      className={`relative flex-row rounded-2xl border p-1 ${
        translucent
          ? "border-white/10 bg-background-secondary/55"
          : "border-border-default bg-background-secondary"
      } ${disabled ? "opacity-50" : ""}`}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[indicatorStyle, { width: segmentWidth }]}
          className="absolute bottom-1 left-1 top-1 rounded-xl bg-brand-primary"
        />
      )}

      {options.map((option, index) => (
        <Pressable
          key={option.key}
          disabled={disabled}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.key === value }}
          accessibilityLabel={
            option.badge == null
              ? option.label
              : `${option.label}, ${option.badge}`
          }
          className={`min-w-0 flex-1 items-center justify-center px-0.5 ${
            badgePlacement === "top" ? "min-h-[54px]" : "min-h-[44px]"
          }`}
          onPress={() => {
            if (option.key === value) {
              onChange(option.key);
              return;
            }
            animateTo(index);
            // Reddedilen seçimde value değişmiyor, senkron effect de
            // çalışmıyor; gösterge burada geri alınmazsa yanlış sekmede kalır.
            if (onChange(option.key) === false) animateTo(activeIndex);
          }}
        >
          <View
            className={`max-w-full items-center justify-center ${
              badgePlacement === "top" ? "flex-col gap-0.5" : "flex-row gap-1"
            }`}
          >
            {badgePlacement === "top" && option.badge != null ? (
              <CountBadge option={option} selected={option.key === value} />
            ) : null}
            <Text
              numberOfLines={1}
              className={`min-w-0 shrink text-center font-body-bold ${
                options.length >= 3 ? "text-overline" : "text-body-sm"
              } ${
                option.key === value
                  ? "text-background-primary"
                  : "text-text-tertiary"
              }`}
            >
              {option.label}
            </Text>
            {badgePlacement === "inline" && option.badge != null ? (
              <CountBadge option={option} selected={option.key === value} />
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function CountBadge({
  option,
  selected,
}: {
  option: { badge?: number };
  selected: boolean;
}) {
  if (option.badge == null) return null;

  return (
    <View
      className={`h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 ${
        selected
          ? "bg-background-primary/15"
          : option.badge > 0
            ? "bg-brand-primary/15"
            : "bg-surface-secondary"
      }`}
    >
      <Text
        numberOfLines={1}
        style={{ fontVariant: ["tabular-nums"] }}
        className={`font-body-bold text-overline leading-[14px] ${
          selected
            ? "text-background-primary"
            : option.badge > 0
              ? "text-brand-primary"
              : "text-text-tertiary"
        }`}
      >
        {option.badge > 99 ? "99+" : option.badge}
      </Text>
    </View>
  );
}
