import * as Clipboard from "expo-clipboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { getCurrentLocale } from "@/i18n";
import {
  type ApiOrganizationDetail,
  organizationRoleLabel,
} from "@/features/organizations/types";

export function OrganizationHero({
  organization,
  eventCount,
  onEdit,
}: {
  organization: ApiOrganizationDetail;
  eventCount: number;
  onEdit?: () => void;
}) {
  const { t } = useTranslation("organizations");
  const organizationName = organization.name?.trim() || t("fallback.name");
  const initial = organizationName
    .charAt(0)
    .toLocaleUpperCase(getCurrentLocale());

  return (
    <View className="relative overflow-hidden rounded-[30px] border border-border-default bg-surface-primary p-5">
      <View className="absolute -right-14 -top-20 h-48 w-48 rounded-full border-[34px] border-brand-primary/10" />
      <View className="absolute right-20 top-7 h-3 w-3 rounded-full bg-brand-primary/30" />

      <View className="flex-row items-start gap-4">
        <View className="h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-brand-primary/30 bg-brand-primary/10">
          <Text className="font-display text-heading-lg text-brand-primary">
            {initial || "O"}
          </Text>
        </View>

        <View className="min-w-0 flex-1 pt-0.5">
          <Text
            numberOfLines={2}
            className="font-display text-heading-lg leading-8 text-text-primary"
          >
            {organizationName}
          </Text>

          <View className="mt-2 flex-row flex-wrap gap-2">
            <InfoPill
              icon="shield-halved"
              label={organizationRoleLabel(organization.myRole)}
            />
            {organization.cityName ? (
              <InfoPill icon="location-dot" label={organization.cityName} />
            ) : null}
          </View>
        </View>

        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("detail.editAccessibility")}
            hitSlop={HIT_SLOP}
            onPress={onEdit}
            className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-background-secondary/80 active:opacity-70"
          >
            <FontAwesome6
              name="pen"
              size={11}
              color={themeColors.brand.primary}
            />
          </Pressable>
        ) : null}
      </View>

      {organization.description ? (
        <Text className="mt-5 font-body text-body-sm leading-5 text-text-secondary">
          {organization.description}
        </Text>
      ) : (
        <Text className="mt-5 font-body text-body-sm leading-5 text-text-tertiary">
          {t("detail.defaultDescription")}
        </Text>
      )}

      <View className="mt-5 flex-row border-t border-border-default pt-4">
        <OrganizationStat
          value={organization.approvedMemberCount}
          label={t("detail.statMembers")}
          icon="user-group"
        />
        <View className="mx-4 h-9 w-px bg-border-default" />
        <OrganizationStat
          value={eventCount}
          label={t("detail.statEvents")}
          icon="calendar-day"
        />
      </View>
    </View>
  );
}

export function InfoPill({
  icon,
  label,
}: {
  icon: "shield-halved" | "location-dot";
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-border-default bg-background-secondary/70 px-2.5 py-1.5">
      <FontAwesome6 name={icon} size={9} color={themeColors.brand.primary} />
      <Text className="font-body-bold text-overline text-text-secondary">
        {label}
      </Text>
    </View>
  );
}

export function OrganizationStat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: "user-group" | "calendar-day";
}) {
  return (
    <View className="flex-1">
      <Text className="font-body-bold text-heading-sm text-text-primary">
        {value}
      </Text>
      <View className="mt-0.5 flex-row items-center gap-1.5">
        <FontAwesome6 name={icon} size={9} color={themeColors.brand.primary} />
        <Text className="font-body text-overline text-text-tertiary">
          {label}
        </Text>
      </View>
    </View>
  );
}
