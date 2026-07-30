/**
 * Date step component for onboarding
 */

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, View } from "react-native";

interface DateStepProps {
  birthDate: Date | null;
  showDatePicker: boolean;
  onDateChange: (event: DateTimePickerEvent, selected?: Date) => void;
  onShowDatePickerChange: (show: boolean) => void;
}

export function DateStep({
  birthDate,
  showDatePicker,
  onDateChange,
  onShowDatePickerChange,
}: DateStepProps) {
  return (
    <View>
      <Text className="font-display text-xl text-white">Kişisel Bilgi</Text>
      <Text className="mt-1 font-body text-sm text-brand-neutral">
        Doğum tarihini seç.
      </Text>

      <Pressable
        onPress={() => onShowDatePickerChange(true)}
        style={({ pressed }) =>
          pressed ? { transform: [{ scale: 0.99 }] } : undefined
        }
        className="mt-6 min-h-[56px] flex-row items-center rounded-2xl border border-brand-tertiary bg-brand-raised px-4"
      >
        <FontAwesome6 name="calendar" size={18} color="#ccff00" />
        <Text className="ml-3 font-body text-base text-white">
          {birthDate
            ? birthDate.toLocaleDateString("tr-TR")
            : "Doğum tarihi seç"}
        </Text>
      </Pressable>

      {showDatePicker && (
        <View className="mt-4 rounded-2xl border border-brand-tertiary bg-brand-raised p-3">
          <DateTimePicker
            value={birthDate ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        </View>
      )}
    </View>
  );
}
