import { Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  AppScreen,
  DateField,
  Input,
  ScreenHeader,
  SelectField,
} from "@/components";
import {
  CREATE_EVENT_COPY,
  CREATE_EVENT_LIMITS,
  DURATION_OPTIONS,
} from "@/constants/events";
import { useCreateEvent } from "@/hooks/use-create-event";

import { LocationPicker } from "./location-picker";
import { PlayersStepper } from "./players-stepper";
import { SubmitBar } from "./submit-bar";

export function EventCreateScreen() {
  const {
    values,
    update,
    setLocation,
    canSubmit,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    submit,
  } = useCreateEvent();

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title={CREATE_EVENT_COPY.header} showBack />}
      contentClassName="gap-5 px-6 pt-2"
      footer={
        <SubmitBar
          disabled={!canSubmit}
          isLoading={isSubmitting}
          onSubmit={submit}
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(420)} className="gap-1.5">
        <Text className="font-display text-3xl leading-9 text-white">
          {CREATE_EVENT_COPY.title}
        </Text>
        <Text className="font-body text-sm leading-5 text-brand-neutral">
          {CREATE_EVENT_COPY.subtitle}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(80)}>
        <SelectField
          label="Spor"
          placeholder={isSportsLoading ? "Sporlar yükleniyor…" : "Spor seç"}
          sheetTitle="Spor seç"
          sheetSubtitle="Etkinliğin sporunu belirle"
          sheetVariant="grid"
          searchable
          searchPlaceholder="Spor ara…"
          value={values.sportSlug}
          onChange={(sportSlug) => update("sportSlug", sportSlug)}
          options={sportOptions.map((sport) => ({
            key: sport.key,
            label: sport.label,
            icon: sport.icon,
          }))}
          disabled={isSportsLoading || isSubmitting}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(420).delay(120)}
        className="gap-4"
      >
        <Input
          label="Başlık"
          placeholder="Örn. Akşam Halı Saha"
          icon="pen"
          value={values.title}
          onChangeText={(title) => update("title", title)}
          maxLength={CREATE_EVENT_LIMITS.titleMax}
          editable={!isSubmitting}
        />

        <Input
          label="Açıklama"
          placeholder="Ne oynuyoruz, ne getirmeli? (opsiyonel)"
          icon="align-left"
          value={values.description}
          onChangeText={(description) => update("description", description)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 110, paddingTop: 14 }}
          editable={!isSubmitting}
        />
      </Animated.View>

      <LocationPicker
        addressText={values.addressText}
        latitude={values.latitude}
        longitude={values.longitude}
        onSelect={setLocation}
      />

      <Animated.View entering={FadeInDown.duration(420).delay(160)}>
        <DateField
          label="Tarih & Saat"
          value={values.eventDate}
          onChange={(eventDate) => update("eventDate", eventDate)}
          minimumDate={new Date()}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(200)}>
        <SelectField
          label="Süre"
          placeholder="Süre seç"
          sheetTitle="Etkinlik süresi"
          sheetSubtitle="Ne kadar sürecek?"
          value={String(values.durationMinutes)}
          onChange={(key) => {
            const option = DURATION_OPTIONS.find((item) => item.key === key);
            if (option) {
              update("durationMinutes", option.minutes);
            }
          }}
          options={DURATION_OPTIONS.map((option) => ({
            key: option.key,
            label: option.label,
          }))}
          disabled={isSubmitting}
        />
      </Animated.View>

      <PlayersStepper
        value={values.maxPlayers}
        onChange={(maxPlayers) => update("maxPlayers", maxPlayers)}
      />
    </AppScreen>
  );
}
