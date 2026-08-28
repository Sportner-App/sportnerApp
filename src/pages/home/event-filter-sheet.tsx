import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheet, Button } from "@/components";
import { GENDER_OPTIONS } from "@/constants/auth";
import type { EventListFilters } from "@/hooks/use-events";
import { AgeRangeSlider } from "@/pages/event-create/age-range-slider";

type EventFilterSheetProps = {
  visible: boolean;
  filters: EventListFilters;
  onClose: () => void;
  onApply: (filters: EventListFilters) => void;
};

const DEFAULT_FILTERS: EventListFilters = {
  minAge: 13,
  maxAge: 120,
  gender: null,
};

export function EventFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: EventFilterSheetProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Etkinlik filtreleri"
      subtitle="Yaş aralığına ve organizatör cinsiyetine göre daralt."
      showCancel={false}
    >
      <View className="gap-5">
        <AgeRangeSlider
          minValue={draft.minAge}
          maxValue={draft.maxAge}
          onChange={(minAge, maxAge) =>
            setDraft((current) => ({ ...current, minAge, maxAge }))
          }
        />

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] text-text-secondary">
            Organizatör cinsiyeti
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label="Tümü"
              selected={draft.gender == null}
              onPress={() =>
                setDraft((current) => ({ ...current, gender: null }))
              }
            />
            {GENDER_OPTIONS.map((option) => (
              <GenderOption
                key={option.key}
                label={option.label}
                selected={draft.gender === Number(option.key)}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    gender: Number(option.key),
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Temizle"
              variant="secondary"
              onPress={() => setDraft(DEFAULT_FILTERS)}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Uygula"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

function GenderOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2.5 active:opacity-75 ${
        selected
          ? "border-brand-primary bg-brand-primary"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text
        className={`font-body-bold text-sm ${
          selected ? "text-background-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
