/**
 * Event form component for create event
 */

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { SPORT_OPTIONS } from "../model/create-event-constants";

interface EventFormProps {
  title: string;
  description: string;
  sportType: string;
  eventDate: Date | null;
  maxPlayersText: string;
  showDatePicker: boolean;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onSportChange: (sport: string) => void;
  onDateChange: (event: DateTimePickerEvent, selected?: Date) => void;
  onMaxPlayersChange: (text: string) => void;
  onShowDatePickerChange: (show: boolean) => void;
}

export function EventForm({
  title,
  description,
  sportType,
  eventDate,
  maxPlayersText,
  showDatePicker,
  onTitleChange,
  onDescriptionChange,
  onSportChange,
  onDateChange,
  onMaxPlayersChange,
  onShowDatePickerChange,
}: EventFormProps) {
  return (
    <View>
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="Başlık"
        placeholderTextColor="#64748b"
        className="min-h-[54px] rounded-2xl border border-brand-tertiary bg-brand-raised px-4 font-body text-base text-white"
      />

      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Açıklama"
        placeholderTextColor="#64748b"
        multiline
        textAlignVertical="top"
        className="mt-3 min-h-[96px] rounded-2xl border border-brand-tertiary bg-brand-raised px-4 py-3 font-body text-base text-white"
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        {SPORT_OPTIONS.map((sport) => {
          const active = sport.key === sportType;

          return (
            <Pressable
              key={sport.key}
              onPress={() => onSportChange(sport.key)}
              className={`rounded-full border px-4 py-2 ${
                active
                  ? "border-brand-primary bg-brand-primary"
                  : "border-brand-tertiary bg-brand-raised"
              }`}
            >
              <Text
                className={`font-body text-sm ${
                  active ? "text-brand-secondary" : "text-brand-neutral"
                }`}
              >
                {sport.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row gap-3">
        <Pressable
          onPress={() => onShowDatePickerChange(true)}
          className="min-h-[54px] flex-1 flex-row items-center rounded-2xl border border-brand-tertiary bg-brand-raised px-4"
        >
          <FontAwesome6 name="calendar" size={18} color="#ccff00" />
          <Text className="ml-2 font-body text-sm text-white">
            {eventDate
              ? eventDate.toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Tarih & Saat"}
          </Text>
        </Pressable>

        <TextInput
          value={maxPlayersText}
          onChangeText={onMaxPlayersChange}
          keyboardType="number-pad"
          placeholder="Kontenjan"
          placeholderTextColor="#64748b"
          className="min-h-[54px] w-28 rounded-2xl border border-brand-tertiary bg-brand-raised px-4 font-body text-base text-white"
        />
      </View>

      {showDatePicker && (
        <View className="mt-4 rounded-2xl border border-brand-tertiary bg-brand-raised p-3">
          <DateTimePicker
            value={eventDate ?? new Date(Date.now() + 60 * 60 * 1000)}
            mode="datetime"
            is24Hour
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "compact" : "default"}
            onChange={onDateChange}
          />
        </View>
      )}
    </View>
  );
}
