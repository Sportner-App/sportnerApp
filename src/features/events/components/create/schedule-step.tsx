import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, DateField } from "@/components";
import type { CreateEventForm } from "@/features/events/hooks/use-create-event";

import { DurationPickerField } from "./duration-picker-field";

export function ScheduleStep({ form }: { form: CreateEventForm }) {
  const { t } = useTranslation("eventCreate");
  const { values, update, isSubmitting } = form;
  const isOrganizationEvent = Boolean(form.organizationId);

  return (
    <View className="mt-7 gap-4">
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
              <Text className="font-body-bold text-body-sm text-text-primary">
                {t("recurring.toggleTitle")}
              </Text>
              <Text className="mt-1 font-body text-caption leading-5 text-text-tertiary">
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
                <Text className="mb-2 font-body-bold text-caption text-text-secondary">
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
                        className={`text-center font-body-bold text-overline ${values.recurrenceIntervalWeeks === option.value ? "text-background-primary" : "text-text-secondary"}`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-body-bold text-body-sm text-text-primary">
                    {t("recurring.countLabel")}
                  </Text>
                  <Text className="mt-1 font-body text-caption text-text-tertiary">
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
                    <Text className="font-display text-heading-sm text-text-primary">
                      −
                    </Text>
                  </Pressable>
                  <Text className="w-7 text-center font-body-bold text-body text-brand-primary">
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
                    <Text className="font-display text-heading-sm text-text-primary">
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
  );
}
