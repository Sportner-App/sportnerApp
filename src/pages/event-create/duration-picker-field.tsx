import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { BottomSheet, Button } from "@/components";
import { themeColors } from "@/constants/theme";

const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);
const HOURS = Array.from({ length: 13 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

type DurationPickerFieldProps = {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
};

export function DurationPickerField({
  value,
  onChange,
  disabled = false,
}: DurationPickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-[13px] text-text-secondary">
        Süre
      </Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3.5 active:bg-surface-secondary disabled:opacity-50"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10">
          <FontAwesome6
            name="clock"
            size={14}
            color={themeColors.brand.primary}
          />
        </View>
        <Text className="flex-1 font-body text-base text-text-primary">
          {formatDuration(value)}
        </Text>
        <FontAwesome6
          name="chevron-down"
          size={11}
          color={themeColors.text.tertiary}
        />
      </Pressable>

      <DurationPickerSheet
        visible={open}
        value={value}
        onClose={() => setOpen(false)}
        onChange={onChange}
      />
    </View>
  );
}

function DurationPickerSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: number;
  onClose: () => void;
  onChange: (minutes: number) => void;
}) {
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const initialHour = Math.min(Math.floor(value / 60), HOURS.length - 1);
  const initialMinute = Math.min(value % 60, MINUTES.length - 1);
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  useEffect(() => {
    if (!visible) return;

    const nextHour = Math.min(Math.floor(value / 60), HOURS.length - 1);
    const nextMinute = Math.min(value % 60, MINUTES.length - 1);
    setHour(nextHour);
    setMinute(nextMinute);

    const timer = setTimeout(() => {
      hourRef.current?.scrollTo({
        y: nextHour * ITEM_HEIGHT,
        animated: false,
      });
      minuteRef.current?.scrollTo({
        y: nextMinute * ITEM_HEIGHT,
        animated: false,
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [value, visible]);

  const totalMinutes = hour * 60 + minute;

  const confirm = () => {
    if (totalMinutes <= 0) return;
    onChange(totalMinutes);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Etkinlik süresi"
      subtitle="Saat ve dakikayı kaydırarak seç"
      showCancel={false}
    >
      <View className="mb-5">
        <View
          pointerEvents="none"
          style={{
            top: WHEEL_PADDING,
            height: ITEM_HEIGHT,
            backgroundColor: themeColors.surface.secondary,
            borderColor: `${themeColors.brand.primary}55`,
          }}
          className="absolute inset-x-2 z-0 rounded-2xl border"
        />

        <View className="z-10 flex-row items-center justify-center px-5">
          <Wheel
            ref={hourRef}
            values={HOURS}
            selected={hour}
            suffix="saat"
            onSelect={setHour}
          />
          <Wheel
            ref={minuteRef}
            values={MINUTES}
            selected={minute}
            suffix="dk"
            onSelect={setMinute}
          />
        </View>

        <View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 z-20 h-[74px] bg-background-primary/75"
        />
        <View
          pointerEvents="none"
          className="absolute inset-x-0 bottom-0 z-20 h-[74px] bg-background-primary/75"
        />
      </View>

      <View className="mb-2 flex-row items-center justify-center gap-2">
        <FontAwesome6
          name="clock"
          size={12}
          color={themeColors.brand.primary}
        />
        <Text className="font-body-bold text-sm text-brand-primary">
          {totalMinutes > 0 ? formatDuration(totalMinutes) : "Süre seçmelisin"}
        </Text>
      </View>

      <Button
        label="Süreyi Ayarla"
        disabled={totalMinutes <= 0}
        haptic="light"
        onPress={confirm}
      />
    </BottomSheet>
  );
}

const Wheel = forwardRef<
  ScrollView,
  {
    values: number[];
    selected: number;
    suffix: string;
    onSelect: (value: number) => void;
  }
>(function Wheel(
  {
    values,
    selected,
    suffix,
    onSelect,
  }: {
    values: number[];
    selected: number;
    suffix: string;
    onSelect: (value: number) => void;
  },
  ref,
) {
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(
      0,
      Math.min(
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        values.length - 1,
      ),
    );
    const next = values[index];
    if (next !== selected) {
      onSelect(next);
      void Haptics.selectionAsync();
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={ref}
        style={{ height: WHEEL_HEIGHT }}
        contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        nestedScrollEnabled
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(event) => {
          if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) {
            settle(event);
          }
        }}
      >
        {values.map((item) => {
          const active = item === selected;
          return (
            <View
              key={item}
              style={{ height: ITEM_HEIGHT }}
              className="flex-row items-center justify-center gap-2"
            >
              <Text
                className={`font-mono text-[30px] ${
                  active ? "font-mono-bold text-brand-primary" : "text-white/30"
                }`}
              >
                {String(item).padStart(2, "0")}
              </Text>
              <Text
                className={`w-8 font-body text-[11px] ${
                  active ? "text-brand-primary" : "text-white/20"
                }`}
              >
                {suffix}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dakika`;
  if (rest === 0) return `${hours} saat`;
  return `${hours} saat ${rest} dakika`;
}
