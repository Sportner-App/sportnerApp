import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { BottomSheet, Button } from "@/components";
import { themeColors } from "@/constants/theme";
import { AppText as Text } from "@/components/app-text";

const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);
const HOURS = Array.from({ length: 13 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

/**
 * Carki dongusel gostermek icin liste bu kadar kez tekrarlaniyor; kullanici
 * her zaman ortadaki blokta tutuluyor. Uca varildiginda ayni degerin ortadaki
 * kopyasina animasyonsuz atlaniyor, boylece 59'dan 0'a (veya 0'dan 59'a)
 * gecis kesintisiz oluyor ve kullanici listenin bir ucundan digerine
 * kaydirmak zorunda kalmiyor.
 */
const LOOP_REPEATS = 3;
const LOOP_MIDDLE_BLOCK = 1;

type WheelHandle = {
  scrollToValue: (value: number, animated?: boolean) => void;
};

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
  const { t } = useTranslation("eventCreate");
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label text-text-secondary">
        {t("duration.label")}
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
        <Text className="flex-1 font-body text-body text-text-primary">
          {formatDuration(t, value)}
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
  const { t } = useTranslation("eventCreate");
  const hourRef = useRef<WheelHandle>(null);
  const minuteRef = useRef<WheelHandle>(null);
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
      hourRef.current?.scrollToValue(nextHour);
      minuteRef.current?.scrollToValue(nextMinute);
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
      title={t("duration.sheetTitle")}
      subtitle={t("duration.sheetSubtitle")}
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
            suffix={t("duration.hourSuffix")}
            onSelect={setHour}
          />
          <Wheel
            ref={minuteRef}
            values={MINUTES}
            selected={minute}
            suffix={t("duration.minuteSuffix")}
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
        <Text className="font-body-bold text-body-sm text-brand-primary">
          {totalMinutes > 0
            ? formatDuration(t, totalMinutes)
            : t("duration.chooseHint")}
        </Text>
      </View>

      <Button
        label={t("duration.confirm")}
        disabled={totalMinutes <= 0}
        haptic="light"
        onPress={confirm}
      />
    </BottomSheet>
  );
}

const Wheel = forwardRef<
  WheelHandle,
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
  const scrollRef = useRef<ScrollView>(null);

  const items = useMemo(
    () => Array.from({ length: LOOP_REPEATS }, () => values).flat(),
    [values],
  );

  /** Bir degerin ortadaki bloktaki kaydirma konumu. */
  const offsetFor = useCallback(
    (index: number) =>
      (LOOP_MIDDLE_BLOCK * values.length + index) * ITEM_HEIGHT,
    [values.length],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToValue: (value: number, animated = false) => {
        const index = values.indexOf(value);
        if (index < 0) return;
        scrollRef.current?.scrollTo({ y: offsetFor(index), animated });
      },
    }),
    [offsetFor, values],
  );

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = Math.max(
      0,
      Math.min(
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        items.length - 1,
      ),
    );
    const index = ((position % values.length) + values.length) % values.length;
    const next = values[index];

    if (next !== selected) {
      onSelect(next);
      void Haptics.selectionAsync();
    }

    // Orta blogun disina cikildiysa ayni degerin ortadaki kopyasina don.
    // Animasyonsuz oldugu icin kullanici atlamayi fark etmiyor.
    if (position < values.length || position >= values.length * 2) {
      scrollRef.current?.scrollTo({ y: offsetFor(index), animated: false });
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
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
        {items.map((item, position) => {
          const active = item === selected;
          return (
            <View
              key={`${item}-${position}`}
              style={{ height: ITEM_HEIGHT }}
              className="flex-row items-center justify-center gap-2"
            >
              <Text
                className={`font-body-bold text-heading-lg ${
                  active
                    ? "font-body-bold text-brand-primary"
                    : "text-text-tertiary"
                }`}
              >
                {String(item).padStart(2, "0")}
              </Text>
              <Text
                className={`w-8 font-body text-overline ${
                  active ? "text-brand-primary" : "text-text-tertiary"
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

function formatDuration(t: TFunction<"eventCreate">, minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return t("duration.minutesShort", { count: rest });
  if (rest === 0) return t("duration.hoursShort", { count: hours });
  return t("duration.hoursAndMinutesShort", { hours, minutes: rest });
}
