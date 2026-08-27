import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import { themeColors } from "@/constants/theme";
import type { DatePickerSheetProps } from "@/types/components";

type PickerMode = "date" | "time";
type WheelItem = { value: number; label: string };

const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);
const HOURS: WheelItem[] = Array.from({ length: 24 }, (_, value) => ({
  value,
  label: String(value).padStart(2, "0"),
}));
const MINUTES: WheelItem[] = Array.from({ length: 60 }, (_, value) => ({
  value,
  label: String(value).padStart(2, "0"),
}));
const MONTHS: WheelItem[] = Array.from({ length: 12 }, (_, value) => ({
  value,
  label: new Date(2026, value, 1).toLocaleDateString("tr-TR", {
    month: "short",
  }),
}));

export function DatePickerSheet({
  visible,
  onClose,
  value,
  onChange,
  title = "Tarih & Saat",
  minimumDate,
}: DatePickerSheetProps) {
  const [draft, setDraft] = useState(value);
  const [mode, setMode] = useState<PickerMode>("date");

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setMode("date");
    }
  }, [visible, value]);

  const firstYear = Math.min(
    minimumDate?.getFullYear() ?? new Date().getFullYear(),
    draft.getFullYear(),
  );
  const years = useMemo<WheelItem[]>(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        value: firstYear + index,
        label: String(firstYear + index),
      })),
    [firstYear],
  );
  const daysInMonth = new Date(
    draft.getFullYear(),
    draft.getMonth() + 1,
    0,
  ).getDate();
  const days = useMemo<WheelItem[]>(
    () =>
      Array.from({ length: daysInMonth }, (_, index) => ({
        value: index + 1,
        label: String(index + 1).padStart(2, "0"),
      })),
    [daysInMonth],
  );

  const updateDatePart = (part: "day" | "month" | "year", next: number) => {
    setDraft((current) => {
      const date = new Date(current);
      if (part === "day") date.setDate(next);
      if (part === "month") {
        const safeDay = Math.min(
          date.getDate(),
          new Date(date.getFullYear(), next + 1, 0).getDate(),
        );
        date.setDate(1);
        date.setMonth(next);
        date.setDate(safeDay);
      }
      if (part === "year") {
        const safeDay = Math.min(
          date.getDate(),
          new Date(next, date.getMonth() + 1, 0).getDate(),
        );
        date.setDate(1);
        date.setFullYear(next);
        date.setDate(safeDay);
      }
      return date;
    });
  };

  const updateTimePart = (part: "hour" | "minute", next: number) => {
    setDraft((current) => {
      const date = new Date(current);
      if (part === "hour") date.setHours(next);
      else date.setMinutes(next);
      date.setSeconds(0, 0);
      return date;
    });
  };

  const isValid = !minimumDate || draft.getTime() >= minimumDate.getTime();

  const confirm = () => {
    if (!isValid) return;
    onChange(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle="Tarih ve saati kaydırarak seç"
      showCancel={false}
    >
      <View className="mb-3 flex-row rounded-2xl border border-border-default bg-surface-primary p-1">
        {(["date", "time"] as const).map((item) => {
          const active = mode === item;
          return (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              className={`min-h-[42px] flex-1 items-center justify-center rounded-xl ${
                active ? "bg-brand-primary" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-body-bold text-sm ${
                  active ? "text-background-primary" : "text-text-secondary"
                }`}
              >
                {item === "date" ? "Tarih" : "Saat"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-4">
        <SelectionBand />
        <View className="z-10 flex-row items-center px-1">
          {mode === "date" ? (
            <>
              <PickerWheel
                items={days}
                selected={draft.getDate()}
                visible={visible}
                onSelect={(next) => updateDatePart("day", next)}
              />
              <PickerWheel
                items={MONTHS}
                selected={draft.getMonth()}
                visible={visible}
                onSelect={(next) => updateDatePart("month", next)}
              />
              <PickerWheel
                items={years}
                selected={draft.getFullYear()}
                visible={visible}
                onSelect={(next) => updateDatePart("year", next)}
              />
            </>
          ) : (
            <>
              <PickerWheel
                items={HOURS}
                selected={draft.getHours()}
                suffix="saat"
                visible={visible}
                onSelect={(next) => updateTimePart("hour", next)}
              />
              <PickerWheel
                items={MINUTES}
                selected={draft.getMinutes()}
                suffix="dk"
                visible={visible}
                onSelect={(next) => updateTimePart("minute", next)}
              />
            </>
          )}
        </View>
        <WheelFades />
      </View>

      <View className="mb-3 items-center">
        <Text className="font-body-bold text-sm text-brand-primary">
          {formatDraft(draft)}
        </Text>
        {!isValid ? (
          <Text className="mt-1 font-body text-xs text-warning">
            Geçmiş bir tarih ve saat seçemezsin.
          </Text>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Pressable
            onPress={onClose}
            className="min-h-[52px] items-center justify-center rounded-2xl border border-border-default bg-surface-primary active:bg-surface-secondary"
          >
            <Text className="font-body-bold text-sm text-text-secondary">
              Vazgeç
            </Text>
          </Pressable>
        </View>
        <View className="flex-1">
          <Button
            label="Tarihi Ayarla"
            disabled={!isValid}
            haptic="light"
            onPress={confirm}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

function PickerWheel({
  items,
  selected,
  suffix,
  visible,
  onSelect,
}: {
  items: WheelItem[];
  selected: number;
  suffix?: string;
  visible: boolean;
  onSelect: (value: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === selected),
    0,
  );

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(
      () =>
        ref.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        }),
      60,
    );
    return () => clearTimeout(timer);
  }, [selectedIndex, visible]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(
      0,
      Math.min(
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        items.length - 1,
      ),
    );
    const next = items[index]?.value;
    if (next != null && next !== selected) {
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
        {items.map((item) => {
          const active = item.value === selected;
          return (
            <View
              key={item.value}
              style={{ height: ITEM_HEIGHT }}
              className="flex-row items-center justify-center gap-1.5"
            >
              <Text
                numberOfLines={1}
                className={`font-mono text-[25px] ${
                  active ? "font-mono-bold text-brand-primary" : "text-white/30"
                }`}
              >
                {item.label}
              </Text>
              {suffix ? (
                <Text
                  className={`font-body text-[10px] ${
                    active ? "text-brand-primary" : "text-white/20"
                  }`}
                >
                  {suffix}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SelectionBand() {
  return (
    <View
      pointerEvents="none"
      style={{
        top: WHEEL_PADDING,
        height: ITEM_HEIGHT,
        backgroundColor: themeColors.surface.secondary,
        borderColor: `${themeColors.brand.primary}55`,
      }}
      className="absolute inset-x-1 z-0 rounded-2xl border"
    />
  );
}

function WheelFades() {
  return (
    <>
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0 z-20 h-[74px] bg-background-primary/75"
      />
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 z-20 h-[74px] bg-background-primary/75"
      />
    </>
  );
}

function formatDraft(date: Date) {
  return date.toLocaleString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
