import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { Trans, useTranslation } from "react-i18next";

import { AppText as Text, SelectField } from "@/components";
import { themeColors } from "@/constants/theme";
import type { ApiOrganizationListItem } from "@/features/organizations/types";

import { ChoicePill } from "./choice-pill";

type OrganizationSelectStepProps = {
  isLocked: boolean;
  lockedOrganizationName?: string;
  wantsOrganizationEvent: boolean;
  onIntentChange: (wants: boolean) => void;
  organizations: ApiOrganizationListItem[];
  organizationId?: string;
  onOrganizationChange: (organizationId: string) => void;
  isOrganizationOnly: boolean;
  onOrganizationOnlyChange: (value: boolean) => void;
  organizerParticipates: boolean;
  onOrganizerParticipatesChange: (value: boolean) => void;
  disabled?: boolean;
};

export function OrganizationSelectStep({
  isLocked,
  lockedOrganizationName,
  wantsOrganizationEvent,
  onIntentChange,
  organizations,
  organizationId,
  onOrganizationChange,
  isOrganizationOnly,
  onOrganizationOnlyChange,
  organizerParticipates,
  onOrganizerParticipatesChange,
  disabled = false,
}: OrganizationSelectStepProps) {
  const { t } = useTranslation("eventCreate");

  const visibilityQuestion = (
    <View className="gap-3">
      <Text className="font-body-bold text-label text-text-secondary">
        {t("organization.visibilityQuestion")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {[
          { value: false, label: t("organization.visibilityPublic") },
          { value: true, label: t("organization.visibilityMembersOnly") },
        ].map((option) => {
          const active = isOrganizationOnly === option.value;
          return (
            <Pressable
              key={String(option.value)}
              disabled={disabled}
              onPress={() => onOrganizationOnlyChange(option.value)}
              className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                active
                  ? "border-brand-primary bg-brand-primary"
                  : "border-border-default bg-surface-primary"
              }`}
            >
              <Text
                className={`font-body-bold text-body-sm ${
                  active ? "text-background-primary" : "text-text-secondary"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const participationQuestion = (
    <View className="gap-3" pointerEvents={disabled ? "none" : "auto"}>
      <Text className="font-body-bold text-label text-text-secondary">
        {t("organization.participationQuestion")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <ChoicePill
          label={t("organization.participationYes")}
          active={organizerParticipates}
          onPress={() => onOrganizerParticipatesChange(true)}
        />
        <ChoicePill
          label={t("organization.participationNo")}
          active={!organizerParticipates}
          onPress={() => onOrganizerParticipatesChange(false)}
        />
      </View>
      {!organizerParticipates ? (
        <Text className="font-body text-caption text-text-tertiary">
          {t("organization.participationNoHint")}
        </Text>
      ) : null}
    </View>
  );

  if (isLocked) {
    return (
      <View className="mt-7 gap-5">
        <View className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10">
            <FontAwesome6
              name="building"
              size={13}
              color={themeColors.brand.primary}
            />
          </View>
          <Text className="flex-1 font-body text-body-sm text-text-secondary">
            <Trans
              t={t}
              i18nKey="organization.lockedText"
              values={{
                name:
                  lockedOrganizationName ??
                  t("organization.lockedFallbackName"),
              }}
              components={{
                bold: <Text className="font-body-bold text-text-primary" />,
              }}
            />
          </Text>
        </View>
        {visibilityQuestion}
        {participationQuestion}
      </View>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  return (
    <View className="mt-7 gap-3">
      <Text className="font-body-bold text-label text-text-secondary">
        {t("organization.intentQuestion")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          disabled={disabled}
          onPress={() => onIntentChange(false)}
          className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
            !wantsOrganizationEvent
              ? "border-brand-primary bg-brand-primary"
              : "border-border-default bg-surface-primary"
          }`}
        >
          <Text
            className={`font-body-bold text-body-sm ${
              !wantsOrganizationEvent
                ? "text-background-primary"
                : "text-text-secondary"
            }`}
          >
            {t("organization.individual")}
          </Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => onIntentChange(true)}
          className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
            wantsOrganizationEvent
              ? "border-brand-primary bg-brand-primary"
              : "border-border-default bg-surface-primary"
          }`}
        >
          <Text
            className={`font-body-bold text-body-sm ${
              wantsOrganizationEvent
                ? "text-background-primary"
                : "text-text-secondary"
            }`}
          >
            {t("organization.organizationEvent")}
          </Text>
        </Pressable>
      </View>

      {wantsOrganizationEvent ? (
        <SelectField
          label={t("organization.label")}
          placeholder={t("organization.placeholder")}
          sheetTitle={t("organization.sheetTitle")}
          sheetSubtitle={t("organization.sheetSubtitle")}
          icon="building"
          value={organizationId ?? ""}
          onChange={onOrganizationChange}
          options={organizations.map((organization) => ({
            key: organization.id,
            label: organization.name,
          }))}
          disabled={disabled}
        />
      ) : null}

      {wantsOrganizationEvent && organizationId ? visibilityQuestion : null}
      {wantsOrganizationEvent && organizationId ? participationQuestion : null}
    </View>
  );
}
