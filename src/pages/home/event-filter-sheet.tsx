import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheet, Button, SelectField } from "@/components";
import { GENDER_OPTIONS } from "@/constants/auth";
import { ONBOARDING_SKILL_OPTIONS } from "@/constants/onboarding";
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
  const [draft, setDraft] = useState(filters);
  const {
    options: cityOptions,
    isLoading: isCitiesLoading,
    error: citiesError,
  } = useCities();
  const locationOptions = [
    {
      key: "",
      label: "Tüm şehirler",
      description: "Konuma göre filtreleme yapma",
    },
    ...cityOptions,
  ];
  const organizationOptions = [
    {
      key: "",
      label: "Tüm organizasyonlar",
      description: "Organizasyona göre filtreleme yapma",
    },
    ...organizations.map((organization) => ({
      key: organization.id,
      label: organization.name,
    })),
  ];
  const sportOptions = [
    {
      key: "",
      label: "Tüm sporlar",
      description: "Branşa göre filtreleme yapma",
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
      title="Etkinlik filtreleri"
      subtitle="Konum, yaş, ücret, seviye ve organizatör cinsiyetine göre daralt."
      showCancel={false}
    >
      <View className="gap-5">
        <SelectField
          label="Konum"
          placeholder={isCitiesLoading ? "Şehirler yükleniyor..." : "Şehir seç"}
          icon="location-dot"
          options={locationOptions}
          value={draft.city ?? ""}
          onChange={(city) =>
            setDraft((current) => ({ ...current, city: city || null }))
          }
          disabled={isCitiesLoading || Boolean(citiesError)}
          searchable
          searchPlaceholder="Şehir ara"
          sheetTitle="Konum seç"
          sheetSubtitle="Etkinliğin bulunduğu şehri seç"
        />

        {sports.length > 0 ? (
          <SelectField
            label="Spor"
            placeholder="Spor seç"
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
            searchPlaceholder="Spor ara"
            sheetTitle="Spor seç"
            sheetSubtitle="Tek bir branşa göre daralt"
            groups={sportGroups}
            allGroupLabel="Tüm kategoriler"
          />
        ) : null}

        {organizations.length > 1 ? (
          <SelectField
            label="Organizasyon"
            placeholder="Organizasyon seç"
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
            searchPlaceholder="Organizasyon ara"
            sheetTitle="Organizasyon seç"
            sheetSubtitle="Hangi organizasyonun etkinliklerini görmek istersin?"
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
            Ücret
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label="Tümü"
              selected={draft.isPaid == null}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: null }))
              }
            />
            <GenderOption
              label="Ücretsiz"
              selected={draft.isPaid === false}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: false }))
              }
            />
            <GenderOption
              label="Ücretli"
              selected={draft.isPaid === true}
              onPress={() =>
                setDraft((current) => ({ ...current, isPaid: true }))
              }
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] text-text-secondary">
            Seviye
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label="Tümü"
              selected={draft.skillLevel == null}
              onPress={() =>
                setDraft((current) => ({ ...current, skillLevel: null }))
              }
            />
            {ONBOARDING_SKILL_OPTIONS.map((option) => (
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
            Organizatör cinsiyeti
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <GenderOption
              label="Tümü"
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
              label="Temizle"
              variant="secondary"
              onPress={() => setDraft(DEFAULT_EVENT_FILTERS)}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Uygula"
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
