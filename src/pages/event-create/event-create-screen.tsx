import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from "react-native-reanimated";

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
  CREATE_EVENT_STEPS,
  DURATION_OPTIONS,
} from "@/constants/events";
import { useCreateEvent } from "@/hooks/use-create-event";

import { EventCreateProgress } from "./event-create-progress";
import { EventCreateSummary } from "./event-create-summary";
import { LocationPicker } from "./location-picker";
import { PlayersStepper } from "./players-stepper";
import { SubmitBar } from "./submit-bar";

type CreateEventStep = 1 | 2 | 3;

const STEP_SHIFT = 20;
const ENTER_MS = 210;
const EXIT_MS = 160;

function stepEntering(direction: { value: number }) {
  return (values: EntryAnimationsValues) => {
    "worklet";
    const shift = direction.value * STEP_SHIFT;
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateX: shift }],
        originX: values.targetOriginX,
        originY: values.targetOriginY,
      },
      animations: {
        opacity: withTiming(1, { duration: ENTER_MS }),
        transform: [{ translateX: withTiming(0, { duration: ENTER_MS }) }],
      },
    };
  };
}

function stepExiting(direction: { value: number }) {
  return (values: ExitAnimationsValues) => {
    "worklet";
    const shift = -direction.value * STEP_SHIFT;
    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateX: 0 }],
        originX: values.currentOriginX,
        originY: values.currentOriginY,
        width: values.currentWidth,
        height: values.currentHeight,
      },
      animations: {
        opacity: withTiming(0, { duration: EXIT_MS }),
        transform: [{ translateX: withTiming(shift, { duration: EXIT_MS }) }],
      },
    };
  };
}

export function EventCreateScreen() {
  const {
    values,
    update,
    setLocation,
    isStep1Valid,
    isStep2Valid,
    canSubmit,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    submit,
  } = useCreateEvent();
  const [currentStep, setCurrentStep] = useState<CreateEventStep>(1);
  const direction = useSharedValue(1);
  const hasMounted = useRef(false);
  const copy = CREATE_EVENT_STEPS[currentStep];

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const goToStep = (step: CreateEventStep) => {
    const isForward = step > currentStep;

    if (isForward && step === 2 && !isStep1Valid) {
      return;
    }

    if (isForward && step === 3 && !isStep2Valid) {
      return;
    }

    direction.value = isForward ? 1 : -1;
    Keyboard.dismiss();
    setCurrentStep(step);
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title={CREATE_EVENT_COPY.header} showBack />}
      contentClassName="px-6 pt-2"
      footer={
        currentStep === 1 ? (
          <SubmitBar
            label={CREATE_EVENT_COPY.continue}
            showIcon={false}
            disabled={!isStep1Valid || isSubmitting}
            isLoading={false}
            pressScale={0.98}
            haptic="light"
            onSubmit={() => goToStep(2)}
          />
        ) : currentStep === 2 ? (
          <SubmitBar
            label={CREATE_EVENT_COPY.continue}
            showIcon={false}
            disabled={!isStep2Valid || isSubmitting}
            isLoading={false}
            pressScale={0.98}
            haptic="light"
            onBack={() => goToStep(1)}
            onSubmit={() => goToStep(3)}
          />
        ) : (
          <SubmitBar
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingLabel={CREATE_EVENT_COPY.publishing}
            pressScale={0.98}
            haptic="light"
            onBack={() => goToStep(2)}
            onSubmit={submit}
          />
        )
      }
    >
      <EventCreateProgress step={currentStep} />

      <Animated.View
        key={currentStep}
        entering={hasMounted.current ? stepEntering(direction) : undefined}
        exiting={stepExiting(direction)}
      >
      <View className="mt-6 gap-1.5">
        <Text className="font-display text-3xl leading-9 text-white">
          {copy.title}
        </Text>
        <Text className="font-body text-sm leading-5 text-brand-neutral">
          {copy.subtitle}
        </Text>
      </View>

      {currentStep === 1 ? (
        <View>
          <View className="mt-7">
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
          </View>

          <View className="mt-4 gap-4">
            <Input
              label="Başlık"
              placeholder="Örn. Akşam Halı Saha"
              icon="pen"
              value={values.title}
              onChangeText={(title) => update("title", title)}
              maxLength={CREATE_EVENT_LIMITS.titleMax}
              editable={!isSubmitting}
            />

            <View>
              <View className="mb-2 flex-row items-baseline gap-2">
                <Text className="font-body text-sm text-brand-neutral">
                  Açıklama
                </Text>
                <Text className="font-body text-xs text-brand-neutral">
                  Opsiyonel
                </Text>
              </View>
              <Input
                placeholder="Ne oynuyoruz, ne getirmeli? (opsiyonel)"
                icon="align-left"
                value={values.description}
                onChangeText={(description) =>
                  update("description", description)
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 110, paddingTop: 14 }}
                editable={!isSubmitting}
              />
            </View>
          </View>
        </View>
      ) : null}

      {currentStep === 2 ? (
        <View>
          <View className="mt-7">
            <LocationPicker
              compact
              addressText={values.addressText}
              latitude={values.latitude}
              longitude={values.longitude}
              onSelect={setLocation}
            />
          </View>

          <View className="mt-4 gap-4">
            <DateField
              label="Tarih & Saat"
              value={values.eventDate}
              onChange={(eventDate) => update("eventDate", eventDate)}
              minimumDate={new Date()}
            />

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
          </View>
        </View>
      ) : null}

      {currentStep === 3 ? (
        <View className="mt-7">
          <PlayersStepper
            value={values.maxPlayers}
            onChange={(maxPlayers) => update("maxPlayers", maxPlayers)}
          />

          <View className="mt-8">
            <EventCreateSummary
              values={values}
              sportOptions={sportOptions}
            />
          </View>
        </View>
      ) : null}
      </Animated.View>
    </AppScreen>
  );
}
