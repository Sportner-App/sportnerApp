import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, Input, SelectField } from "@/components";
import type { CreateEventForm } from "@/features/events/hooks/use-create-event";
import { useSkillLevelOptions } from "@/features/onboarding/copy";

import { AgeRangeSlider } from "@/features/events/components/age-range-slider";
import { ChoicePill } from "./choice-pill";
import { EventCreateSummary } from "./event-create-summary";
import { PlayersStepper } from "./players-stepper";

export function RulesStep({ form }: { form: CreateEventForm }) {
  const { t } = useTranslation("eventCreate");
  const { values, update, isSubmitting, sportOptions } = form;
  const ONBOARDING_SKILL_OPTIONS = useSkillLevelOptions();
  const participantGenderOptions = [
    {
      key: "all",
      label: t("participantGender.everyone"),
      icon: "users" as const,
    },
    {
      key: "1",
      label: t("participantGender.womenOnly"),
      icon: "person-dress" as const,
    },
    {
      key: "2",
      label: t("participantGender.menOnly"),
      icon: "person" as const,
    },
  ];

  return (
    <View className="mt-7">
      <PlayersStepper
        value={values.maxPlayers}
        onChange={(maxPlayers) => update("maxPlayers", maxPlayers)}
      />

      <View className="mt-6 gap-2">
        <Text className="font-body-bold text-label text-text-secondary">
          {t("ageRange.restrictionLabel")}
        </Text>
        <Text className="font-body text-caption text-text-tertiary">
          {t("ageRange.disclaimer")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ChoicePill
            label={t("events:ageRange.all")}
            active={!values.hasAgeRestriction}
            onPress={() => update("hasAgeRestriction", false)}
          />
          <ChoicePill
            label={t("ageRange.restrict")}
            active={values.hasAgeRestriction}
            onPress={() => update("hasAgeRestriction", true)}
          />
        </View>
        {values.hasAgeRestriction ? (
          <View className="mt-2">
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
        ) : null}
      </View>

      <View className="mt-6">
        <SelectField
          label={t("participantGender.label")}
          placeholder={t("participantGender.placeholder")}
          options={participantGenderOptions}
          value={
            values.participantGender == null
              ? "all"
              : String(values.participantGender)
          }
          onChange={(value) =>
            update("participantGender", value === "all" ? null : Number(value))
          }
          sheetTitle={t("participantGender.sheetTitle")}
          sheetSubtitle={t("participantGender.sheetSubtitle")}
          disabled={isSubmitting}
        />
        <Text className="mt-2 font-body text-caption text-text-tertiary">
          {t("participantGender.hint")}
        </Text>
      </View>

      <View className="mt-6 gap-2">
        <Text className="font-body-bold text-label text-text-secondary">
          {t("fee.label")}
        </Text>
        <Text className="font-body text-caption text-text-tertiary">
          {t("fee.disclaimer")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ChoicePill
            label={t("events:fee.free")}
            active={!values.isPaid}
            onPress={() => {
              update("isPaid", false);
              update("feeAmountText", "");
            }}
          />
          <ChoicePill
            label={t("fee.paid")}
            active={values.isPaid}
            onPress={() => update("isPaid", true)}
          />
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
        <Text className="font-body-bold text-label text-text-secondary">
          {t("skill.label")}
        </Text>
        <Text className="font-body text-caption text-text-tertiary">
          {t("skill.disclaimer")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ChoicePill
            label={t("skill.none")}
            active={values.skillLevel == null}
            onPress={() => update("skillLevel", null)}
          />
          {ONBOARDING_SKILL_OPTIONS.map((option) => {
            const active = values.skillLevel === option.level;
            return (
              <ChoicePill
                key={option.key}
                label={option.label}
                active={active}
                onPress={() => update("skillLevel", option.level)}
              />
            );
          })}
        </View>
      </View>

      <View className="mt-8">
        <EventCreateSummary values={values} sportOptions={sportOptions} />
      </View>
    </View>
  );
}
