import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BottomSheet, Button, SelectField } from "@/components";
import { useGenderOptions } from "@/constants/auth";
import { useSkillLevelOptions } from "@/constants/onboarding";
import {
  DEFAULT_EVENT_FILTERS,
  type EventListFilters,
} from "@/hooks/use-events";
import { useCities } from "@/hooks/use-cities";
import { AgeRangeSlider } from "@/pages/event-create/age-range-slider";
import type { ApiOrganizationListItem } from "@/types/organizations";
import type { Sport } from "@/types/sports";
import { sportIconForSlug } from "@/utils/events";

type EventFilterSheetProps = {
  visible: boolean;
  filters: EventListFilters;
  onClose: () => void;
  onApply: (filters: EventListFilters) => void;
  organizations?: ApiOrganizationListItem[];
  sports?: Sport[];
};

export function EventFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
  organizations = [],
  sports = [],
}: EventFilterSheetProps) {
  const { t } = useTranslation("home");
  const { t: tCommon } = useTranslation("common");
  const [draft, setDraft] = useState(filters);
  const GENDER_OPTIONS = useGenderOptions();
  const SKILL_OPTIONS = useSkillLevelOptions();
  const {
    options: cityOptions,
    isLoading: isCitiesLoading,
    error: citiesError,
  } = useCities();
  const locationOptions = [
    {
      key: "",
      label: t("filterSheet.location.allLabel"),
      description: t("filterSheet.location.allDescription"),
    },
    ...cityOptions,
  ];
  const organizationOptions = [
    {
      key: "",
      label: t("filterSheet.organization.allLabel"),
      description: t("filterSheet.organization.allDescription"),
    },
    ...organizations.map((organization) => ({
      key: organization.id,
      label: organization.name,
    })),
  ];
  const sportOptions = [
    {
      key: "",
      label: t("filterSheet.sport.allLabel"),
      description: t("filterSheet.sport.allDescription"),
    },
    ...sports.map((sport) => ({
      key: sport.id,
      label: sport.name,
      description: sport.categoryName ?? undefined,
      icon: sportIconForSlug(sport.slug),
      groupKey: sport.categoryId ?? undefined,
    })),
  ];
  const sportGroups = [
    ...new Map(
      sports
        .filter((sport) => sport.categoryId && sport.categoryName)
        .map((sport) => [
          sport.categoryId as string,
          { key: sport.categoryId as string, label: sport.categoryName as string },
        ]),
    ).values(),
  ];

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("filterSheet.title")}
      subtitle={t("filterSheet.subtitle")}
      showCancel={false}
    >
      <View className="gap-5">
        <SelectField
          label={t("filterSheet.location.label")}
          placeholder={
            isCitiesLoading
              ? t("filterSheet.location.loading")
              : t("filterSheet.location.placeholder")
          }
          icon="location-dot"
          options={locationOptions}
          value={draft.city ?? ""}
          onChange={(city) =>
            setDraft((current) => ({ ...current, city: city || null }))
          }
          disabled={isCitiesLoading || Boolean(citiesError)}
          searchable
          searchPlaceholder={t("filterSheet.location.searchPlaceholder")}
          sheetTitle={t("filterSheet.location.sheetTitle")}
          sheetSubtitle={t("filterSheet.location.sheetSubtitle")}
        />

        {sports.length > 0 ? (
          <SelectField
            label={t("filterSheet.sport.label")}
            placeholder={t("filterSheet.sport.placeholder")}
            icon="shapes"
            options={sportOptions}
            value={draft.sportId ?? ""}
            onChange={(sportId) =>
              setDraft((current) => ({
                ...current,
                sportId: sportId || null,
              }))
            }
            searchable
            searchPlaceholder={t("filterSheet.sport.searchPlaceholder")}
            sheetTitle={t("filterSheet.sport.sheetTitle")}
            sheetSubtitle={t("filterSheet.sport.sheetSubtitle")}
            groups={sportGroups}
            allGroupLabel={t("filterSheet.sport.allGroupLabel")}
          />
        ) : null}

        {organizations.length > 1 ? (
          <SelectField
            label={t("filterSheet.organization.label")}
            placeholder={t("filterSheet.organization.placeholder")}
            icon="building"
            options={organizationOptions}
            value={draft.organizationId ?? ""}
            onChange={(organizationId) =>
              setDraft((current) => ({
                ...current,
                organizationId: organizationId || null,
              }))
            }
            searchable
            searchPlaceholder={t("filterSheet.organization.searchPlaceholder")}
            sheetTitle={t("filterSheet.organization.sheetTitle")}
            sheetSubtitle={t("filterSheet.organization.sheetSubtitle")}
          />
        ) : null}

        <AgeRangeSlider
          minValue={draft.minAge}
          maxValue={draft.maxAge}
          onChange={(minAge, maxAge) =>
            setDraft((current) => ({ ...current, minAge, maxAge }))
          }
        />

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] text-text-secondary">
            {t("filterSheet.fee.label")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label={tCommon("all")}
              selected={draft.isPaid == null}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: null }))
              }
            />
            <GenderOption
              label={t("filterSheet.fee.free")}
              selected={draft.isPaid === false}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: false }))
              }
            />
            <GenderOption
              label={t("filterSheet.fee.paid")}
              selected={draft.isPaid === true}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: true }))
              }
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] text-text-secondary">
            {t("filterSheet.skillLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label={tCommon("all")}
              selected={draft.skillLevel == null}
              onPress={() =>
                setDraft((current) => ({ ...current, skillLevel: null }))
              }
            />
            {SKILL_OPTIONS.map((option) => (
              <GenderOption
                key={option.key}
                label={option.label}
                selected={draft.skillLevel === option.level}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    skillLevel: option.level,
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] text-text-secondary">
            {t("filterSheet.organizerGenderLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label={tCommon("all")}
              selected={draft.gender == null}
              onPress={() =>
                setDraft((current) => ({ ...current, gender: null }))
              }
            />
            {GENDER_OPTIONS.map((option) => (
              <GenderOption
                key={option.key}
                label={option.label}
                selected={draft.gender === Number(option.key)}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    gender: Number(option.key),
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label={tCommon("clear")}
              variant="secondary"
              onPress={() => setDraft(DEFAULT_EVENT_FILTERS)}
            />
          </View>
          <View className="flex-1">
            <Button
              label={tCommon("apply")}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

function GenderOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2.5 active:opacity-75 ${
        selected
          ? "border-brand-primary bg-brand-primary"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text
        className={`font-body-bold text-sm ${
          selected ? "text-background-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
