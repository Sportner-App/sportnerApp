import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BottomSheet } from "@/components";

type PlayersStepperProps = {
  value: string;
  onChange: (value: string) => void;
};

const MIN = 2;
const MAX = 100;

export function PlayersStepper({ value, onChange }: PlayersStepperProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(Number(value) || MIN);
  const count = Number(value) || MIN;

  useEffect(() => {
    if (open) {
      setDraft(count);
    }
  }, [open, count]);

  const bump = (delta: number) => {
    setDraft((prev) => Math.min(MAX, Math.max(MIN, prev + delta)));
  };

  const confirm = () => {
    onChange(String(draft));
    setOpen(false);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(240)}
      className="gap-2"
    >
      <Text className="font-body text-sm text-brand-neutral">
        Maksimum oyuncu
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5 active:opacity-80"
      >
        <FontAwesome6 name="users" size={15} color="#ccff00" />
        <Text className="flex-1 font-body text-base text-white">
          {count} kişi
        </Text>
        <FontAwesome6 name="chevron-down" size={12} color="#64748b" />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Oyuncu sayısı"
        subtitle="2 ile 100 arasında seç"
        showCancel={false}
      >
        <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-brand-secondary/70 px-4 py-4">
          <Pressable
            hitSlop={8}
            onPress={() => bump(-1)}
            disabled={draft <= MIN}
            className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 active:opacity-80 disabled:opacity-40"
          >
            <FontAwesome6 name="minus" size={14} color="#f8fafc" />
          </Pressable>

          <View className="items-center">
            <Text className="font-display text-4xl text-white">{draft}</Text>
            <Text className="font-mono text-[11px] text-brand-neutral">
              kişi
            </Text>
          </View>

          <Pressable
            hitSlop={8}
            onPress={() => bump(1)}
            disabled={draft >= MAX}
            className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 active:opacity-80 disabled:opacity-40"
          >
            <FontAwesome6 name="plus" size={14} color="#f8fafc" />
          </Pressable>
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => setOpen(false)}
            className="flex-1 items-center rounded-2xl border border-white/10 py-3.5 active:opacity-80"
          >
            <Text className="font-body text-sm text-brand-neutral">Vazgeç</Text>
          </Pressable>
          <Pressable
            onPress={confirm}
            className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-80"
          >
            <Text className="font-body text-sm font-semibold text-brand-secondary">
              Tamam
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </Animated.View>
  );
}
