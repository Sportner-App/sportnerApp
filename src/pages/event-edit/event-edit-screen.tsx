import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  updateEventFee,
  updateEventLocation,
  updateEventSchedule,
} from "@/services/events-service";
import { parseFeeAmount } from "@/utils/events";

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
  const [isPaid, setIsPaid] = useState(false);
  const [feeAmountText, setFeeAmountText] = useState("");
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
    setIsPaid(event.isPaid);
    setFeeAmountText(
      event.isPaid && event.feeAmount != null ? String(event.feeAmount) : "",
    );
  }, [event]);

  const save = async () => {
    if (!event || isSaving || latitude == null || longitude == null) {
      return;
    }

    if (isPaid) {
      const fee = parseFeeAmount(feeAmountText);
      if (fee == null || fee <= 0 || fee > CREATE_EVENT_LIMITS.feeAmountMax) {
        showToast({
          type: "error",
          title: "Fiyat gerekli",
          description: "Ücretli etkinlik için 0'dan büyük bir fiyat gir.",
        });
        return;
      }
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
        updateEventFee(event.id, {
          isPaid,
          feeAmount: isPaid ? parseFeeAmount(feeAmountText) : null,
        }),
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
          Başlık, zaman, konum, kapasite ve ücreti güncelle.
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
      <View className="gap-2">
        <Text className="font-body-bold text-[13px] text-text-secondary">
          Ücret
        </Text>
        <Text className="font-body text-xs text-text-tertiary">
          Uygulama üzerinden ödeme alınmaz.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => {
              setIsPaid(false);
              setFeeAmountText("");
            }}
            className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
              !isPaid
                ? "border-brand-primary bg-brand-primary"
                : "border-border-default bg-surface-primary"
            }`}
          >
            <Text
              className={`font-body-bold text-sm ${
                !isPaid ? "text-background-primary" : "text-text-secondary"
              }`}
            >
              Ücretsiz
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsPaid(true)}
            className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
              isPaid
                ? "border-brand-primary bg-brand-primary"
                : "border-border-default bg-surface-primary"
            }`}
          >
            <Text
              className={`font-body-bold text-sm ${
                isPaid ? "text-background-primary" : "text-text-secondary"
              }`}
            >
              Ücretli
            </Text>
          </Pressable>
        </View>
        {isPaid ? (
          <Input
            label="Fiyat"
            placeholder="Örn. 150"
            icon="coins"
            value={feeAmountText}
            onChangeText={setFeeAmountText}
            keyboardType="decimal-pad"
            helperText="Türk lirası. Katılımcı etkinlikte öder."
          />
        ) : null}
      </View>
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
