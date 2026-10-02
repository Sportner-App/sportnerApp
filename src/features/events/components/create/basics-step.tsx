import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, Input, SelectField } from "@/components";
import { CREATE_EVENT_LIMITS } from "@/features/events/copy";
import type { CreateEventForm } from "@/features/events/hooks/use-create-event";

import { OrganizationSelectStep } from "./organization-select-step";

export function BasicsStep({ form }: { form: CreateEventForm }) {
  const { t } = useTranslation("eventCreate");
  const {
    values,
    update,
    organizationId,
    setOrganizationId,
    wantsOrganizationEvent,
    setOrganizationIntent,
    organizations,
    isOrganizationLocked,
    isSubmitting,
    isSportsLoading,
    sportOptions,
    sportGroups,
  } = form;
  const lockedOrganizationName = form.organizations.find(
    (organization) => organization.id === form.organizationId,
  )?.name;

  return (
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
            <Text className="font-body text-body-sm text-text-secondary">
              {t("description.label")}
            </Text>
            <Text className="rounded-pill bg-surface-secondary px-2 py-0.5 font-body text-overline text-text-tertiary">
              {t("description.optional")}
            </Text>
          </View>
          <Input
            placeholder={t("description.placeholder")}
            icon="align-left"
            value={values.description}
            onChangeText={(description) => update("description", description)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 110, paddingTop: 14 }}
            editable={!isSubmitting}
          />
        </View>
      </View>
    </View>
  );
}
