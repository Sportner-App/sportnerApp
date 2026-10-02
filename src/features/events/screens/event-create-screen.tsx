import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppScreen, AppText as Text, ScreenHeader } from "@/components";
import {
  useCreateEventCopy,
  useCreateEventSteps,
} from "@/features/events/copy";
import { useCreateEvent } from "@/features/events/hooks/use-create-event";
import { BasicsStep } from "@/features/events/components/create/basics-step";
import { RulesStep } from "@/features/events/components/create/rules-step";
import { ScheduleStep } from "@/features/events/components/create/schedule-step";
import {
  stepEntering,
  stepExiting,
} from "@/features/events/components/create/step-transitions";

import { EventCreateProgress } from "@/features/events/components/create/event-create-progress";
import { EventCompanionsStep } from "@/features/events/components/create/event-companions-step";
import { EventCreateSummary } from "@/features/events/components/create/event-create-summary";
import { LocationPicker } from "@/features/events/components/create/location-picker";
import { SubmitBar } from "@/features/events/components/create/submit-bar";

type CreateEventStep = 1 | 2 | 3 | 4 | 5;

export function EventCreateScreen() {
  const { t } = useTranslation("eventCreate");
  const CREATE_EVENT_COPY = useCreateEventCopy();
  const CREATE_EVENT_STEPS = useCreateEventSteps();
  const { organizationId: routeOrganizationId } = useLocalSearchParams<{
    organizationId?: string;
  }>();
  const initialOrganizationId = Array.isArray(routeOrganizationId)
    ? routeOrganizationId[0]
    : routeOrganizationId;
  const form = useCreateEvent(initialOrganizationId);
  const {
    values,
    setLocation,
    clearLocation,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    canSubmit,
    isSubmitting,
    sportOptions,
    friends,
    isFriendsLoading,
    guests,
    selectedFriendIds,
    remainingCompanionSlots,
    addGuest,
    updateGuest,
    removeGuest,
    toggleFriend,
    submit,
  } = form;
  const [currentStep, setCurrentStep] = useState<CreateEventStep>(1);
  const direction = useSharedValue(1);
  const hasMounted = useRef(false);
  const copy = CREATE_EVENT_STEPS[currentStep];

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // "Devam" butonunun aktifliği; 4. adımda misafir alanları da geçerli olmalı.
  const stepIsComplete: Record<number, boolean> = {
    1: isStep1Valid,
    2: isStep2Valid,
    3: isStep3Valid,
    4: canSubmit,
  };

  const goToStep = (step: CreateEventStep) => {
    const isForward = step > currentStep;

    // İleri giderken, bırakılan adımın geçerli olması gerekir.
    const canLeave: Record<number, boolean> = {
      2: isStep1Valid,
      3: isStep2Valid,
      4: isStep3Valid,
      5: isStep4Valid,
    };
    if (isForward && !canLeave[step]) {
      return;
    }

    direction.value = isForward ? 1 : -1;
    Keyboard.dismiss();
    setCurrentStep(step);
  };

  return (
    <AppScreen
      tone="light"
      keyboardAvoiding
      header={
        <ScreenHeader title={CREATE_EVENT_COPY.header} showBack tone="light" />
      }
      contentClassName="px-5 pt-2"
      footer={
        currentStep < 5 ? (
          <SubmitBar
            label={CREATE_EVENT_COPY.continue}
            backLabel={currentStep > 1 ? CREATE_EVENT_COPY.back : undefined}
            showIcon={false}
            disabled={!stepIsComplete[currentStep] || isSubmitting}
            isLoading={false}
            pressScale={0.98}
            haptic="light"
            onBack={
              currentStep > 1
                ? () => goToStep((currentStep - 1) as CreateEventStep)
                : undefined
            }
            onSubmit={() => goToStep((currentStep + 1) as CreateEventStep)}
          />
        ) : (
          <SubmitBar
            label={
              guests.length === 0 && selectedFriendIds.length === 0
                ? t("skipAndPublish")
                : CREATE_EVENT_COPY.submit
            }
            backLabel={CREATE_EVENT_COPY.back}
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingLabel={CREATE_EVENT_COPY.publishing}
            pressScale={0.98}
            haptic="light"
            onBack={() => goToStep(4)}
            onSubmit={submit}
          />
        )
      }
    >
      <StatusBar style="light" />
      <EventCreateProgress step={currentStep} />

      <Animated.View
        key={currentStep}
        entering={hasMounted.current ? stepEntering(direction) : undefined}
        exiting={stepExiting(direction)}
      >
        {currentStep === 2 ? (
          <Text className="mt-4 font-body text-body-sm leading-5 text-text-secondary">
            {copy.subtitle}
          </Text>
        ) : (
          <View className="mt-7 gap-2">
            <Text className="font-display text-heading-lg leading-[38px] text-text-primary">
              {copy.title}
            </Text>
            <Text className="max-w-[320px] font-body text-body-sm leading-5 text-text-secondary">
              {copy.subtitle}
            </Text>
          </View>
        )}

        {currentStep === 1 ? <BasicsStep form={form} /> : null}

        {currentStep === 2 ? (
          <View className="mt-4">
            <LocationPicker
              expanded
              addressText={values.addressText}
              latitude={values.latitude}
              longitude={values.longitude}
              onSelect={setLocation}
              onClear={clearLocation}
            />
          </View>
        ) : null}

        {currentStep === 3 ? <ScheduleStep form={form} /> : null}

        {currentStep === 4 ? <RulesStep form={form} /> : null}

        {currentStep === 5 ? (
          <>
            <EventCompanionsStep
              maxParticipants={Number(values.maxPlayers)}
              remainingSlots={remainingCompanionSlots}
              guests={guests}
              friends={friends}
              selectedFriendIds={selectedFriendIds}
              isFriendsLoading={isFriendsLoading}
              onAddGuest={addGuest}
              onUpdateGuest={updateGuest}
              onRemoveGuest={removeGuest}
              onToggleFriend={toggleFriend}
            />
            <View className="mt-6">
              <EventCreateSummary values={values} sportOptions={sportOptions} />
            </View>
          </>
        ) : null}
      </Animated.View>
    </AppScreen>
  );
}
