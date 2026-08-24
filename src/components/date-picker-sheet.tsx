import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import type { DatePickerSheetProps } from "@/types/components";

type PickerMode = "date" | "time";

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

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      return;
    }

    const next = new Date(draft);

    if (mode === "date") {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }

    setDraft(next);
  };

  const confirm = () => {
    onChange(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle="Tarih ve saati seç, sonra onayla"
      showCancel={false}
    >
      <View className="mb-3 flex-row gap-2 rounded-2xl border border-white/10 bg-brand-secondary/70 p-1">
        {(["date", "time"] as const).map((item) => {
          const isActive = mode === item;

          return (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                isActive ? "bg-brand-primary" : ""
              }`}
            >
              <Text
                className={`font-body text-sm font-semibold ${
                  isActive ? "text-brand-secondary" : "text-brand-neutral"
                }`}
              >
                {item === "date" ? "Tarih" : "Saat"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="overflow-hidden rounded-2xl border border-white/10 bg-brand-secondary/50">
        <DateTimePicker
          value={draft}
          mode={mode}
          display="spinner"
          onChange={handleChange}
          minimumDate={minimumDate}
          themeVariant="dark"
          accentColor="#ccff00"
          locale="tr-TR"
          style={
            Platform.OS === "ios"
              ? { height: 180, alignSelf: "center" }
              : undefined
          }
        />
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={onClose}
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
  );
}
