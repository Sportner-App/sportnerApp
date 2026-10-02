import * as Clipboard from "expo-clipboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  brandRefreshControl,
  Button,
  EmptyState,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import { useRefreshableLoad } from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getOrganization,
  leaveOrganization,
  listOrganizationEvents,
  listOrganizationMembers,
  rotateInviteCode,
} from "@/features/organizations/services/organizations-service";
import type { EventSummary } from "@/features/events/types";
import {
  ORGANIZATION_STATUS,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
} from "@/features/organizations/types";
import { mapListItemToSummary } from "@/features/events/mappers";
import {
  shareOrganizationInvite,
  shareOrganizationInviteViaWhatsApp,
} from "@/features/organizations/organization-invite";
import { resolveRouteParam } from "@/utils/route-params";

import {
  MEMBER_PREVIEW_LIMIT,
  OrganizationMemberRow,
  buildMemberPreview,
} from "@/features/organizations/components/organization-member-row";
import { confirmDestructive } from "@/utils/confirm";
import { OrganizationHero } from "@/features/organizations/components/organization-hero";

export function OrganizationDetailScreen() {
  const { t } = useTranslation(["organizations", "common"]);
  const router = useRouter();
  const { showToast } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const organizationId = useMemo(() => resolveRouteParam(rawId), [rawId]);
  const [organization, setOrganization] =
    useState<ApiOrganizationDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [members, setMembers] = useState<ApiOrganizationMember[]>([]);

  const load = useCallback(async () => {
    if (!organizationId) return;
    try {
      const detail = await getOrganization(organizationId);
      setOrganization(detail);

      if (detail.myStatus === ORGANIZATION_STATUS.approved) {
        try {
          const organizationEvents =
            await listOrganizationEvents(organizationId);
          setEvents(organizationEvents.map(mapListItemToSummary));
        } catch (error) {
          setEvents([]);
          showToast({
            type: "error",
            title: t("organizations:detail.eventsLoadFailed"),
            description: getApiErrorMessage(error),
          });
        }

        try {
          setMembers(await listOrganizationMembers(organizationId));
        } catch (error) {
          setMembers([]);
          showToast({
            type: "error",
            title: t("organizations:detail.membersLoadFailed"),
            description: getApiErrorMessage(error),
          });
        }
      } else {
        setEvents([]);
        setMembers([]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.loadFailed"),
        description: getApiErrorMessage(error),
      });
      setOrganization(null);
    }
  }, [organizationId, showToast, t]);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
    refocusMode: "initial",
  });

  const copyCode = async () => {
    if (!organization?.inviteCode) return;
    await Clipboard.setStringAsync(organization.inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({
      type: "success",
      title: t("organizations:detail.codeCopied"),
      description: organization.inviteCode,
    });
  };

  const shareCode = async () => {
    if (!organization?.inviteCode) return;
    try {
      await shareOrganizationInvite(organization.name, organization.inviteCode);
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.shareFailed"),
        description: getApiErrorMessage(error),
      });
    }
  };

  const shareCodeViaWhatsApp = async () => {
    if (!organization?.inviteCode) return;
    try {
      await shareOrganizationInviteViaWhatsApp(
        organization.name,
        organization.inviteCode,
      );
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.whatsappFailed"),
        description: getApiErrorMessage(error),
      });
    }
  };

  const rotateCode = async () => {
    if (!organization) return;
    try {
      const next = await rotateInviteCode(organization.id);
      setOrganization(next);
      showToast({
        type: "success",
        title: t("organizations:detail.codeRotated"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.codeRotateFailed"),
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmLeave = () => {
    if (!organization) return;
    confirmDestructive({
      title: t("organizations:detail.leaveTitle"),
      message: t("organizations:detail.leaveMessage"),
      confirmLabel: t("organizations:detail.leaveConfirm"),
      onConfirm: () => {
        void leaveOrganization(organization.id)
          .then(() => {
            showToast({
              type: "success",
              title: t("organizations:detail.left"),
            });
            router.replace("/organizations");
          })
          .catch((error) => {
            showToast({
              type: "error",
              title: t("organizations:detail.leaveFailed"),
              description: getApiErrorMessage(error),
            });
          });
      },
    });
  };

  const memberPreview = useMemo(
    () =>
      organization
        ? buildMemberPreview(members, organization.canManageMembers)
        : [],
    [members, organization],
  );

  const approvedCount = useMemo(
    () =>
      members.filter((member) => member.status === ORGANIZATION_STATUS.approved)
        .length,
    [members],
  );

  const pendingCount = useMemo(
    () =>
      members.filter((member) => member.status === ORGANIZATION_STATUS.pending)
        .length,
    [members],
  );

  const showAllMembersLink =
    members.length > MEMBER_PREVIEW_LIMIT || organization?.canManageMembers;

  return (
    <AppScreen
      header={<ScreenHeader title={t("organizations:detail.title")} showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: refresh,
      })}
    >
      {isLoading ? (
        <ScreenLoader />
      ) : !organization ? (
        <EmptyState
          variant="inline"
          message={t("organizations:detail.notFound")}
        />
      ) : (
        <>
          <OrganizationHero
            organization={organization}
            eventCount={events.length}
            onEdit={
              organization.canUpdateDetails
                ? () => router.push(`/organizations/${organization.id}/edit`)
                : undefined
            }
          />

          {organization.myStatus === ORGANIZATION_STATUS.pending ? (
            <View className="rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4">
              <Text className="font-body-bold text-body-sm text-amber-200">
                {t("organizations:detail.pendingTitle")}
              </Text>
              <Text className="mt-1 font-body text-body-sm text-text-secondary">
                {t("organizations:detail.pendingDescription")}
              </Text>
            </View>
          ) : (
            <>
              {organization.inviteCode ? (
                <View className="rounded-3xl border border-border-default bg-surface-primary p-4">
                  <Text className="font-body text-caption text-text-tertiary">
                    {t("organizations:detail.inviteCodeLabel")}
                  </Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <Pressable
                      onPress={() => void copyCode()}
                      className="min-w-0 flex-1 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3 active:opacity-80"
                    >
                      <Text
                        selectable
                        className="font-body-bold text-heading-md tracking-[0.2em] text-text-primary"
                      >
                        {organization.inviteCode}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        "organizations:detail.copyCodeAccessibility",
                      )}
                      onPress={() => void copyCode()}
                      hitSlop={HIT_SLOP}
                      className="h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-surface-secondary active:bg-surface-primary"
                    >
                      <FontAwesome6
                        name="copy"
                        size={16}
                        color={themeColors.brand.primary}
                      />
                    </Pressable>
                  </View>
                  <Text className="mt-2 font-body text-caption text-text-tertiary">
                    {t("organizations:detail.copyCodeHint")}
                  </Text>
                  <View className="mt-3 flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        label={t("organizations:detail.share")}
                        size="sm"
                        onPress={shareCode}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label="WhatsApp"
                        variant="outline"
                        size="sm"
                        onPress={shareCodeViaWhatsApp}
                      />
                    </View>
                    {organization.canRotateInviteCode ? (
                      <View className="flex-1">
                        <Button
                          label={t("organizations:detail.refreshCode")}
                          variant="outline"
                          size="sm"
                          onPress={rotateCode}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View className="flex-row items-center justify-between">
                <Text className="font-display text-heading-sm text-text-primary">
                  {t("organizations:detail.eventsTitle")}
                </Text>
                {organization.canCreateEvents ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/events/create",
                        params: { organizationId: organization.id },
                      })
                    }
                    hitSlop={HIT_SLOP}
                  >
                    <Text className="font-body-bold text-overline text-brand-primary">
                      {t("organizations:detail.createEvent")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {events.length === 0 ? (
                <Text className="font-body text-body-sm text-text-tertiary">
                  {t("organizations:detail.noEvents")}
                </Text>
              ) : (
                <Button
                  label={t("organizations:detail.viewLinkedEvents")}
                  variant="outline"
                  icon="calendar-day"
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)",
                      params: {
                        scope: "organizations",
                        organizationId: organization.id,
                      },
                    })
                  }
                />
              )}

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-display text-heading-sm text-text-primary">
                    {t("organizations:detail.membersTitle")}
                  </Text>
                  <Text className="font-body text-caption text-text-tertiary">
                    {t("organizations:detail.memberCount", {
                      count: approvedCount,
                    })}
                    {organization.canManageMembers && pendingCount > 0
                      ? ` · ${t("organizations:detail.pendingCount", { count: pendingCount })}`
                      : ""}
                  </Text>
                </View>
                {showAllMembersLink ? (
                  <Pressable
                    hitSlop={HIT_SLOP}
                    onPress={() =>
                      router.push({
                        pathname: "/organizations/[id]/members",
                        params: {
                          id: organization.id,
                          tab:
                            organization.canManageMembers && pendingCount > 0
                              ? "pending"
                              : "members",
                        },
                      })
                    }
                  >
                    <Text className="font-body-bold text-overline text-brand-primary">
                      {t("organizations:detail.seeAll")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {memberPreview.length === 0 ? (
                <Text className="font-body text-body-sm text-text-tertiary">
                  {t("organizations:detail.noMembers")}
                </Text>
              ) : (
                memberPreview.map((member) => (
                  <OrganizationMemberRow
                    key={member.userId}
                    member={member}
                    organization={organization}
                    showActions={false}
                    onPressProfile={() =>
                      router.push(`/users/${member.userId}`)
                    }
                  />
                ))
              )}

              {members.length > memberPreview.length ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/organizations/[id]/members",
                      params: { id: organization.id },
                    })
                  }
                  className="items-center rounded-2xl border border-border-default bg-surface-primary py-3 active:bg-surface-secondary"
                >
                  <Text className="font-body-bold text-body-sm text-brand-primary">
                    {t("organizations:detail.moreMembers", {
                      count: members.length - memberPreview.length,
                    })}
                  </Text>
                </Pressable>
              ) : null}

              {organization.canLeave ? (
                <Button
                  label={t("organizations:detail.leaveOrganization")}
                  variant="danger"
                  onPress={confirmLeave}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </AppScreen>
  );
}
