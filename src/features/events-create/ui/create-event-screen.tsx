import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/features/auth/model/auth-context";
import { createEvent } from "@/features/events-create";
import { useToast } from "@/shared/ui/toast-provider";
import { INITIAL_REGION } from "../model/create-event-constants";
import { EventForm } from "./event-form";
import { LocationPicker } from "./location-picker";

export function CreateEventScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { userId, isReady } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [maxPlayersText, setMaxPlayersText] = useState("");
  const [addressText, setAddressText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!userId) {
      router.replace("/(auth)/login");
    }
  }, [isReady, router, userId]);

  const maxPlayers = useMemo(
    () => Number.parseInt(maxPlayersText, 10),
    [maxPlayersText],
  );

  const isValid =
    title.trim().length >= 3 &&
    sportType.length > 0 &&
    eventDate &&
    Number.isFinite(maxPlayers) &&
    maxPlayers >= 2 &&
    addressText.trim().length > 0 &&
    marker;

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selected) {
      setEventDate(selected);
    }
  };

  const handleCreateEvent = async () => {
    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }

    if (!isValid || !eventDate || !marker) {
      showToast({
        type: "error",
        title: "Eksik bilgi",
        description: "Lütfen zorunlu alanları tamamla.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        sportType,
        eventDate: eventDate.toISOString(),
        maxPlayers,
        addressText: addressText.trim(),
        latitude: marker.latitude,
        longitude: marker.longitude,
        createdBy: userId,
      });

      showToast({
        type: "success",
        title: "Etkinlik oluşturuldu",
      });

      router.replace("/(tabs)");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Etkinlik oluşturma başarısız oldu.";

      showToast({
        type: "error",
        title: "Kayıt başarısız",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-secondary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        contentContainerClassName="px-5 pb-10 pt-20"
      >
        <View className="rounded-[28px] border border-brand-tertiary bg-brand-surface px-5 pb-6 pt-5">
          <Text className="font-display text-3xl text-white">
            Etkinlik Oluştur
          </Text>
          <Text className="mt-2 font-body text-sm text-brand-neutral">
            Konumu seç, bilgileri gir ve topluluğu davet et.
          </Text>

          <View className="mt-5">
            <EventForm
              title={title}
              description={description}
              sportType={sportType}
              eventDate={eventDate}
              maxPlayersText={maxPlayersText}
              showDatePicker={showDatePicker}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onSportChange={setSportType}
              onDateChange={handleDateChange}
              onMaxPlayersChange={setMaxPlayersText}
              onShowDatePickerChange={setShowDatePicker}
            />
          </View>

          <View className="mt-4">
            <LocationPicker
              searchQuery={searchQuery}
              addressText={addressText}
              marker={marker}
              mapRegion={mapRegion}
              isResolvingAddress={isResolvingAddress}
              onSearchChange={setSearchQuery}
              onAddressChange={setAddressText}
              onMarkerChange={setMarker}
              onRegionChange={setMapRegion}
            />
          </View>

          <Pressable
            onPress={handleCreateEvent}
            disabled={isSubmitting}
            style={({ pressed }) =>
              pressed && !isSubmitting
                ? { transform: [{ scale: 0.99 }] }
                : undefined
            }
            className={`mt-5 min-h-[56px] items-center justify-center rounded-2xl border border-brand-primary bg-brand-primary ${
              isSubmitting ? "opacity-70" : ""
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <View className="flex-row items-center">
                <FontAwesome6 name="compass" size={16} color="#0f172a" />
                <Text className="ml-2 font-body text-base font-semibold text-brand-secondary">
                  Etkinlik Oluştur
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
