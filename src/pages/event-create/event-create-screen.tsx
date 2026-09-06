import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  DateField,
  Input,
  ScreenHeader,
  SelectField,
} from "@/components";
import {
  CREATE_EVENT_LIMITS,
  useCreateEventCopy,
  useCreateEventSteps,
} from "@/constants/events";
import { useSkillLevelOptions } from "@/constants/onboarding";
import { useCreateEvent } from "@/hooks/use-create-event";

import { EventCreateProgress } from "./event-create-progress";
import { AgeRangeSlider } from "./age-range-slider";
import { EventCompanionsStep } from "./event-companions-step";
import { EventCreateSummary } from "./event-create-summary";
import { DurationPickerField } from "./duration-picker-field";
import { LocationPicker } from "./location-picker";
import { OrganizationSelectStep } from "./organization-select-step";
import { PlayersStepper } from "./players-stepper";
import { SubmitBar } from "./submit-bar";

type CreateEventStep = 1 | 2 | 3 | 4;

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
  const { t } = useTranslation("eventCreate");
  const CREATE_EVENT_COPY = useCreateEventCopy();
  const CREATE_EVENT_STEPS = useCreateEventSteps();
  const ONBOARDING_SKILL_OPTIONS = useSkillLevelOptions();
  const { organizationId: routeOrganizationId } = useLocalSearchParams<{
    organizationId?: string;
  }>();
  const initialOrganizationId = Array.isArray(routeOrganizationId)
    ? routeOrganizationId[0]
    : routeOrganizationId;
  const {
    values,
    update,
    setLocation,
    organizationId,
    setOrganizationId,
    wantsOrganizationEvent,
    setOrganizationIntent,
    organizations,
    isOrganizationLocked,
    isStep1Valid,
    isStep2Valid,
    canSubmit,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    sportGroups,
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
  } = useCreateEvent(initialOrganizationId);
  const isOrganizationEvent = Boolean(organizationId);
  const lockedOrganizationName = organizations.find(
    (organization) => organization.id === organizationId,
  )?.name;
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
      tone="light"
      keyboardAvoiding
      header={
        <ScreenHeader title={CREATE_EVENT_COPY.header} showBack tone="light" />
      }
      contentClassName="px-5 pt-2"
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
            backLabel={CREATE_EVENT_COPY.back}
            showIcon={false}
            disabled={!isStep2Valid || isSubmitting}
            isLoading={false}
            pressScale={0.98}
            haptic="light"
            onBack={() => goToStep(1)}
            onSubmit={() => goToStep(3)}
          />
        ) : currentStep === 3 ? (
          <SubmitBar
            label={CREATE_EVENT_COPY.continue}
            backLabel={CREATE_EVENT_COPY.back}
            showIcon={false}
            disabled={!canSubmit || isSubmitting}
            isLoading={false}
            pressScale={0.98}
            haptic="light"
            onBack={() => goToStep(2)}
            onSubmit={() => goToStep(4)}
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
            onBack={() => goToStep(3)}
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
        <View className="mt-7 gap-2">
          <Text className="font-display text-[32px] leading-[38px] text-text-primary">
            {copy.title}
          </Text>
          <Text className="max-w-[320px] font-body text-sm leading-5 text-text-secondary">
            {copy.subtitle}
          </Text>
        </View>

        {currentStep === 1 ? (
          <View>
            <OrganizationSelectStep
              isLocked={isOrganizationLocked}
              lockedOrganizationName={lockedOrganizationName}
              wantsOrganizationEvent={wantsOrganizationEvent}
              onIntentChange={setOrganizationIntent}
              organizations={organizations}
              organizationId={organizationId}
              onOrganizationChange={setOrganizationId}
              disabled={isSubmitting}
            />

            <View className="mt-7">
              <SelectField
                label={t("sport.label")}
                placeholder={
                  isSportsLoading ? t("sport.loading") : t("sport.placeholder")
                }
                sheetTitle={t("sport.sheetTitle")}
                sheetSubtitle={t("sport.sheetSubtitle")}
                sheetVariant="grid"
                searchable
                searchPlaceholder={t("sport.searchPlaceholder")}
                value={values.sportSlug}
                onChange={(sportSlug) => update("sportSlug", sportSlug)}
                options={sportOptions.map((sport) => ({
                  key: sport.key,
                  label: sport.label,
                  icon: sport.icon,
                  description: sport.description,
                  groupKey: sport.groupKey,
                }))}
                groups={sportGroups}
                allGroupLabel={t("sport.allGroupLabel")}
                disabled={isSportsLoading || isSubmitting}
              />
            </View>

            <View className="mt-4 gap-4">
              <Input
                label={t("title.label")}
                placeholder={t("title.placeholder")}
                icon="pen"
                value={values.title}
                onChangeText={(title) => update("title", title)}
                maxLength={CREATE_EVENT_LIMITS.titleMax}
                editable={!isSubmitting}
              />

              <View>
                <View className="mb-2 flex-row items-baseline gap-2">
                  <Text className="font-body text-sm text-text-secondary">
                    {t("description.label")}
                  </Text>
                  <Text className="rounded-pill bg-surface-secondary px-2 py-0.5 font-body text-[10px] text-text-tertiary">
                    {t("description.optional")}
                  </Text>
                </View>
                <Input
                  placeholder={t("description.placeholder")}
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
                label={t("dateTime.label")}
                value={values.eventDate}
                onChange={(eventDate) => update("eventDate", eventDate)}
                minimumDate={new Date()}
              />

              <DurationPickerField
                value={values.durationMinutes}
                onChange={(durationMinutes) =>
                  update("durationMinutes", durationMinutes)
                }
                disabled={isSubmitting}
              />

              {isOrganizationEvent ? null : (
              <View className="rounded-[24px] border border-border-default bg-surface-primary p-4">
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: values.isRecurring }}
                  onPress={() => update("isRecurring", !values.isRecurring)}
                  className="flex-row items-center justify-between active:opacity-80"
                >
                  <View className="flex-1 pr-4">
                    <Text className="font-body-bold text-sm text-text-primary">
                      {t("recurring.toggleTitle")}
                    </Text>
                    <Text className="mt-1 font-body text-xs leading-5 text-text-tertiary">
                      {t("recurring.toggleDescription")}
                    </Text>
                  </View>
                  <View
                    className={`h-7 w-12 justify-center rounded-full px-1 ${values.isRecurring ? "bg-brand-primary" : "bg-surface-secondary"}`}
                  >
                    <View
                      className={`h-5 w-5 rounded-full bg-white ${values.isRecurring ? "self-end" : "self-start"}`}
                    />
                  </View>
                </Pressable>

                {values.isRecurring ? (
                  <View className="mt-4 gap-4 border-t border-border-default pt-4">
                    <View>
                      <Text className="mb-2 font-body-bold text-xs text-text-secondary">
                        {t("recurring.frequencyLabel")}
                      </Text>
                      <View className="flex-row gap-2">
                        {(
                          [
                            { value: 1, label: t("recurring.everyWeek") },
                            { value: 2, label: t("recurring.every2Weeks") },
                            { value: 4, label: t("recurring.every4Weeks") },
                          ] as const
                        ).map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() =>
                              update("recurrenceIntervalWeeks", option.value)
                            }
                            className={`flex-1 items-center rounded-full border px-2 py-2.5 ${values.recurrenceIntervalWeeks === option.value ? "border-brand-primary bg-brand-primary" : "border-border-default bg-surface-secondary"}`}
                          >
                            <Text
                              className={`text-center font-body-bold text-[11px] ${values.recurrenceIntervalWeeks === option.value ? "text-background-primary" : "text-text-secondary"}`}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-body-bold text-sm text-text-primary">
                          {t("recurring.countLabel")}
                        </Text>
                        <Text className="mt-1 font-body text-xs text-text-tertiary">
                          {t("recurring.countHint")}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Pressable
                          disabled={values.recurrenceCount <= 2}
                          onPress={() =>
                            update(
                              "recurrenceCount",
                              Math.max(2, values.recurrenceCount - 1),
                            )
                          }
                          className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary disabled:opacity-35"
                        >
                          <Text className="font-display text-xl text-text-primary">
                            −
                          </Text>
                        </Pressable>
                        <Text className="w-7 text-center font-mono text-base text-brand-primary">
                          {values.recurrenceCount}
                        </Text>
                        <Pressable
                          disabled={values.recurrenceCount >= 12}
                          onPress={() =>
                            update(
                              "recurrenceCount",
                              Math.min(12, values.recurrenceCount + 1),
                            )
                          }
                          className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary disabled:opacity-35"
                        >
                          <Text className="font-display text-xl text-text-primary">
                            +
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
              )}
            </View>
          </View>
        ) : null}

        {currentStep === 3 ? (
          <View className="mt-7">
            <PlayersStepper
              value={values.maxPlayers}
              onChange={(maxPlayers) => update("maxPlayers", maxPlayers)}
            />

            <View className="mt-6">
              <AgeRangeSlider
                minValue={Number(values.minParticipantAge)}
                maxValue={Number(values.maxParticipantAge)}
                disabled={isSubmitting}
                onChange={(minAge, maxAge) => {
                  update("minParticipantAge", String(minAge));
                  update("maxParticipantAge", String(maxAge));
                }}
              />
            </View>

            <View className="mt-6 gap-2">
              <Text className="font-body-bold text-[13px] text-text-secondary">
                {t("fee.label")}
              </Text>
              <Text className="font-body text-xs text-text-tertiary">
                {t("fee.disclaimer")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => {
                    update("isPaid", false);
                    update("feeAmountText", "");
                  }}
                  className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                    !values.isPaid
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-default bg-surface-primary"
                  }`}
                >
                  <Text
                    className={`font-body-bold text-sm ${
                      !values.isPaid
                        ? "text-background-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {t("events:fee.free")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => update("isPaid", true)}
                  className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                    values.isPaid
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-default bg-surface-primary"
                  }`}
                >
                  <Text
                    className={`font-body-bold text-sm ${
                      values.isPaid
                        ? "text-background-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {t("fee.paid")}
                  </Text>
                </Pressable>
              </View>
              {values.isPaid ? (
                <Input
                  label={t("fee.priceLabel")}
                  placeholder={t("fee.pricePlaceholder")}
                  icon="coins"
                  value={values.feeAmountText}
                  onChangeText={(feeAmountText) =>
                    update("feeAmountText", feeAmountText)
                  }
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                  helperText={t("fee.priceHelper")}
                />
              ) : null}
            </View>

            <View className="mt-6 gap-2">
              <Text className="font-body-bold text-[13px] text-text-secondary">
                {t("skill.label")}
              </Text>
              <Text className="font-body text-xs text-text-tertiary">
                {t("skill.disclaimer")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => update("skillLevel", null)}
                  className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                    values.skillLevel == null
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-default bg-surface-primary"
                  }`}
                >
                  <Text
                    className={`font-body-bold text-sm ${
                      values.skillLevel == null
                        ? "text-background-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {t("skill.none")}
                  </Text>
                </Pressable>
                {ONBOARDING_SKILL_OPTIONS.map((option) => {
                  const active = values.skillLevel === option.level;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => update("skillLevel", option.level)}
                      className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                        active
                          ? "border-brand-primary bg-brand-primary"
                          : "border-border-default bg-surface-primary"
                      }`}
                    >
                      <Text
                        className={`font-body-bold text-sm ${
                          active
                            ? "text-background-primary"
                            : "text-text-secondary"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mt-8">
              <EventCreateSummary values={values} sportOptions={sportOptions} />
            </View>
          </View>
        ) : null}

        {currentStep === 4 ? (
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
