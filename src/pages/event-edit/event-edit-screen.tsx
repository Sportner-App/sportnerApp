import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  DateField,
  Input,
  ScreenHeader,
  SelectField,
} from "@/components";
import { CREATE_EVENT_LIMITS, DURATION_OPTIONS } from "@/constants/events";
import { useToast } from "@/contexts";
import { useEventDetail } from "@/hooks/use-event-detail";
import { LocationPicker } from "@/pages/event-create/location-picker";
import { SubmitBar } from "@/pages/event-create/submit-bar";
import {
  updateEventCapacity,
  updateEventDetails,
  updateEventLocation,
  updateEventSchedule,
} from "@/services/events-service";

export function EventEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { event, isLoading } = useEventDetail(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [addressText, setAddressText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!event) {
      return;
    }
    setTitle(event.title);
    setDescription(
      event.description === "Açıklama eklenmemiş." ? "" : event.description,
    );
    setEventDate(new Date(event.eventDate));
    setDurationMinutes(event.durationMinutes);
    setMaxPlayers(String(event.maxParticipants ?? 10));
    setAddressText(event.address);
    setLatitude(event.latitude);
    setLongitude(event.longitude);
  }, [event]);

  const save = async () => {
    if (!event || isSaving || latitude == null || longitude == null) {
      return;
    }

    setIsSaving(true);
    try {
      const results = await Promise.all([
        updateEventDetails(event.id, {
          title: title.trim(),
          description: description.trim() || null,
        }),
        updateEventSchedule(event.id, {
          eventDate: eventDate.toISOString(),
          durationMinutes,
        }),
        updateEventLocation(event.id, {
          latitude,
          longitude,
          address: addressText.trim(),
        }),
        updateEventCapacity(event.id, Number(maxPlayers) || null),
      ]);

      const failed = results.find((item) => item.error);
      if (failed?.error) {
        showToast({
          type: "error",
          title: "Kaydedilemedi",
          description: failed.error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: "Güncellendi",
        description: "Etkinlik bilgileri kaydedildi.",
      });
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="DÜZENLE" showBack />}
      contentClassName="gap-5 px-6 pt-2"
      footer={
        <SubmitBar
          label="Kaydet"
          disabled={!title.trim() || isLoading}
          isLoading={isSaving}
          onSubmit={save}
        />
      }
    >
      <View className="gap-1.5">
        <Text className="font-display text-3xl text-white">Etkinliği düzenle</Text>
        <Text className="font-body text-sm text-brand-neutral">
          Başlık, zaman, konum ve kapasiteyi güncelle.
        </Text>
      </View>

      <Input
        label="Başlık"
        value={title}
        onChangeText={setTitle}
        maxLength={CREATE_EVENT_LIMITS.titleMax}
      />
      <Input
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 110, paddingTop: 14 }}
      />
      <DateField label="Tarih & Saat" value={eventDate} onChange={setEventDate} />
      <SelectField
        label="Süre"
        value={String(durationMinutes)}
        onChange={(key) => {
          const option = DURATION_OPTIONS.find((item) => item.key === key);
          if (option) {
            setDurationMinutes(option.minutes);
          }
        }}
        options={DURATION_OPTIONS.map((option) => ({
          key: option.key,
          label: option.label,
        }))}
      />
      <Input
        label="Oyuncu sayısı"
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        keyboardType="number-pad"
      />
      <LocationPicker
        addressText={addressText}
        latitude={latitude}
        longitude={longitude}
        onSelect={(location) => {
          setAddressText(location.addressText);
          setLatitude(location.latitude);
          setLongitude(location.longitude);
        }}
      />
    </AppScreen>
  );
}
