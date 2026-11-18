import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import {
  type ApiOrganizationDetail,
  ORGANIZATION_ROLE,
  organizationRoleLabel,
} from "@/features/organizations/types";
import type { IconName } from "@/types/components";
import { getCurrentLocale } from "@/i18n";
import { resolveMediaUrl } from "@/utils/media-url";

export function OrganizationHero({
  organization,
  eventCount,
  completedEventCount,
  onPressMembers,
}: {
  organization: ApiOrganizationDetail;
  eventCount: number;
  completedEventCount: number;
  onPressMembers?: () => void;
}) {
  const { t } = useTranslation("organizations");
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const organizationName = organization.name?.trim() || t("fallback.name");
  const resolvedUri = organization.imageUrl
    ? resolveMediaUrl(organization.imageUrl)
    : null;
  const hasPhoto = Boolean(resolvedUri && failedUri !== resolvedUri);
  const initial = organizationName
    .charAt(0)
    .toLocaleUpperCase(getCurrentLocale());

  const role = organization.myRole;
  const isPrivileged =
    role === ORGANIZATION_ROLE.founder || role === ORGANIZATION_ROLE.admin;
  const roleIcon: IconName =
    role === ORGANIZATION_ROLE.founder
      ? "crown"
      : role === ORGANIZATION_ROLE.admin
        ? "shield-halved"
        : "user";

  return (
    <View>
      <View className="overflow-hidden rounded-[24px] border border-border-default bg-surface-primary p-3">
        {hasPhoto && resolvedUri ? (
          <>
            <Image
              source={{ uri: resolvedUri }}
              blurRadius={40}
              resizeMode="cover"
              style={{ opacity: 0.35 }}
              className="absolute inset-0"
            />
            <View
              pointerEvents="none"
              className="absolute inset-0"
              style={{
                backgroundColor: themeColors.background.primary,
                opacity: 0.55,
              }}
            />
          </>
        ) : (
          <View
            pointerEvents="none"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
            style={{
              backgroundColor: themeColors.brand.primary,
              opacity: 0.08,
            }}
          />
        )}

        <View className="flex-row items-center gap-3">
          {hasPhoto && resolvedUri ? (
            <Image
              source={{ uri: resolvedUri }}
              resizeMode="cover"
              onError={() => setFailedUri(resolvedUri)}
              className="h-16 w-16 overflow-hidden rounded-[18px] border-2 border-border-default"
            />
          ) : (
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-[18px] border-2 border-border-default bg-surface-secondary">
              <Text
                className="font-display text-brand-primary"
                style={{ fontSize: 30, lineHeight: 36 }}
              >
                {initial || "K"}
              </Text>
            </View>
          )}

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={2}
              className="font-display text-heading-sm text-text-primary"
            >
              {organizationName}
            </Text>
            {organization.cityName ? (
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <FontAwesome6
                  name="location-dot"
                  size={10}
                  color={themeColors.text.tertiary}
                />
                <Text
                  numberOfLines={1}
                  className="min-w-0 shrink font-body text-caption text-text-secondary"
                >
                  {organization.cityName}
                </Text>
              </View>
            ) : null}

            <View className="mt-1.5 flex-row flex-wrap gap-1.5">
              <View className="flex-row items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-0.5">
                <FontAwesome6
                  name={organization.isPublic ? "globe" : "lock"}
                  size={9}
                  color={themeColors.text.secondary}
                />
                <Text className="font-body-bold text-caption text-text-secondary">
                  {organization.isPublic
                    ? t("visibility.public")
                    : t("visibility.private")}
                </Text>
              </View>
              {role != null ? (
                <View
                  className={`flex-row items-center gap-1.5 rounded-full px-2 py-0.5 ${
                    isPrivileged
                      ? "bg-brand-primary/15"
                      : "bg-surface-secondary"
                  }`}
                >
                  <FontAwesome6
                    name={roleIcon}
                    size={9}
                    color={
                      isPrivileged
                        ? themeColors.brand.primary
                        : themeColors.text.secondary
                    }
                  />
                  <Text
                    className={`font-body-bold text-caption ${
                      isPrivileged
                        ? "text-brand-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {organizationRoleLabel(role)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row items-center rounded-xl bg-surface-secondary/70 py-2">
          <HeroStat
            value={organization.approvedMemberCount}
            label={t("detail.statMembers")}
            onPress={onPressMembers}
          />
          <View className="h-6 w-px bg-border-default" />
          <HeroStat value={eventCount} label={t("detail.statEvents")} />
          <View className="h-6 w-px bg-border-default" />
          <HeroStat
            value={completedEventCount}
            label={t("detail.statCompleted")}
          />
        </View>
      </View>

      {organization.description ? (
        <Text className="mt-4 font-body text-body-sm leading-5 text-text-secondary">
          {organization.description}
        </Text>
      ) : (
        <Text className="mt-4 font-body text-body-sm leading-5 text-text-tertiary">
          {t("detail.defaultDescription")}
        </Text>
      )}
    </View>
  );
}

function HeroStat({
  value,
  label,
  onPress,
}: {
  onPress?: () => void;
  value: number;
  label: string;
}) {
  const content = (
    <>
      <Text
        numberOfLines={1}
        className="font-display text-heading-sm text-text-primary"
      >
        {value}
      </Text>
      <View className="flex-row items-center gap-1">
        <Text
          numberOfLines={1}
          className="shrink font-body text-caption text-text-tertiary"
        >
          {label}
        </Text>
        {onPress ? (
          <FontAwesome6
            name="chevron-right"
            size={9}
            color={themeColors.text.tertiary}
          />
        ) : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={HIT_SLOP}
        onPress={onPress}
        className="min-w-0 flex-1 items-center active:opacity-70"
      >
        {content}
      </Pressable>
    );
  }
  return <View className="min-w-0 flex-1 items-center">{content}</View>;
}
