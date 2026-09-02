import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getOrganization,
  leaveOrganization,
  listOrganizationEvents,
  listOrganizationMembers,
  rotateInviteCode,
} from "@/services/organizations-service";
import type { EventSummary } from "@/types/events";
import {
  ORGANIZATION_STATUS,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
  organizationRoleLabel,
} from "@/types/organizations";
import { mapListItemToSummary } from "@/utils/events";
import {
  shareOrganizationInvite,
  shareOrganizationInviteViaWhatsApp,
} from "@/utils/organization-invite";
import { resolveRouteParam } from "@/utils/route-params";

import {
  MEMBER_PREVIEW_LIMIT,
  OrganizationMemberRow,
  buildMemberPreview,
} from "./organization-member-row";

export function OrganizationDetailScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const organizationId = useMemo(() => resolveRouteParam(rawId), [rawId]);
  const [organization, setOrganization] =
    useState<ApiOrganizationDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [members, setMembers] = useState<ApiOrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!organizationId) return;
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);
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
              title: "Etkinlikler yüklenemedi",
              description: getApiErrorMessage(error),
            });
          }

          try {
            setMembers(await listOrganizationMembers(organizationId));
          } catch (error) {
            setMembers([]);
            showToast({
              type: "error",
              title: "Üyeler yüklenemedi",
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
          title: "Yüklenemedi",
          description: getApiErrorMessage(error),
        });
        setOrganization(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [organizationId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load("initial");
    }, [load]),
  );

  const copyCode = async () => {
    if (!organization?.inviteCode) return;
    await Clipboard.setStringAsync(organization.inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({
      type: "success",
      title: "Kod kopyalandı",
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
        title: "Paylaşılamadı",
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
        title: "WhatsApp açılamadı",
        description: getApiErrorMessage(error),
      });
    }
  };

  const rotateCode = async () => {
    if (!organization) return;
    try {
      const next = await rotateInviteCode(organization.id);
      setOrganization(next);
      showToast({ type: "success", title: "Yeni kod oluşturuldu" });
    } catch (error) {
      showToast({
        type: "error",
        title: "Kod yenilenemedi",
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmLeave = () => {
    if (!organization) return;
    Alert.alert("Ayrıl", "Bu organizasyondan ayrılmak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Ayrıl",
        style: "destructive",
        onPress: () => {
          void leaveOrganization(organization.id)
            .then(() => {
              showToast({ type: "success", title: "Organizasyondan ayrıldın" });
              router.replace("/organizations");
            })
            .catch((error) => {
              showToast({
                type: "error",
                title: "Ayrılamadın",
                description: getApiErrorMessage(error),
              });
            });
        },
      },
    ]);
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
      header={<ScreenHeader title="ORGANİZASYON" showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : !organization ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          Organizasyon bulunamadı.
        </Text>
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
              <Text className="font-body text-sm font-semibold text-amber-200">
                Onay bekleniyor
              </Text>
              <Text className="mt-1 font-body text-sm text-text-secondary">
                Kurucu veya yönetici isteğini onaylayınca etkinlikleri
                görebilirsin.
              </Text>
            </View>
          ) : (
            <>
              {organization.inviteCode ? (
                <View className="rounded-3xl border border-border-default bg-surface-primary p-4">
                  <Text className="font-body text-xs text-text-tertiary">
                    Davet kodu
                  </Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <Pressable
                      onPress={() => void copyCode()}
                      className="min-w-0 flex-1 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3 active:opacity-80"
                    >
                      <Text
                        selectable
                        className="font-mono text-2xl tracking-[0.2em] text-text-primary"
                      >
                        {organization.inviteCode}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Davet kodunu kopyala"
                      onPress={() => void copyCode()}
                      hitSlop={8}
                      className="h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-surface-secondary active:bg-surface-primary"
                    >
                      <FontAwesome6
                        name="copy"
                        size={16}
                        color={themeColors.brand.primary}
                      />
                    </Pressable>
                  </View>
                  <Text className="mt-2 font-body text-xs text-text-tertiary">
                    Koda dokunarak da kopyalayabilirsin.
                  </Text>
                  <View className="mt-3 flex-row gap-2">
                    <View className="flex-1">
                      <Button label="Paylaş" size="sm" onPress={shareCode} />
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
                          label="Yenile"
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
                <Text className="font-display text-lg text-text-primary">
                  Etkinlikler
                </Text>
                {organization.canCreateEvents ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/events/create",
                        params: { organizationId: organization.id },
                      })
                    }
                    hitSlop={8}
                  >
                    <Text className="font-body text-[11px] font-semibold text-brand-primary">
                      Oluştur
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {events.length === 0 ? (
                <Text className="font-body text-sm text-text-tertiary">
                  Bu organizasyona ait yayınlanmış etkinlik yok.
                </Text>
              ) : (
                <Button
                  label="Organizasyona bağlı etkinlikleri gör"
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
                  <Text className="font-display text-lg text-text-primary">
                    Üyeler
                  </Text>
                  <Text className="font-body text-xs text-text-tertiary">
                    {approvedCount} üye
                    {organization.canManageMembers && pendingCount > 0
                      ? ` · ${pendingCount} onay bekliyor`
                      : ""}
                  </Text>
                </View>
                {showAllMembersLink ? (
                  <Pressable
                    hitSlop={8}
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
                    <Text className="font-body text-[11px] font-semibold text-brand-primary">
                      Tümünü gör
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {memberPreview.length === 0 ? (
                <Text className="font-body text-sm text-text-tertiary">
                  Henüz üye yok.
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
                  <Text className="font-body text-sm font-semibold text-brand-primary">
                    +{members.length - memberPreview.length} üye daha
                  </Text>
                </Pressable>
              ) : null}

              {organization.canLeave ? (
                <Button
                  label="Organizasyondan ayrıl"
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

function OrganizationHero({
  organization,
  eventCount,
  onEdit,
}: {
  organization: ApiOrganizationDetail;
  eventCount: number;
  onEdit?: () => void;
}) {
  // Production may still contain legacy organization rows whose name is null.
  // Keep the detail route renderable instead of crashing on String.trim().
  const organizationName = organization.name?.trim() || "Organizasyon";
  const initial = organizationName.charAt(0).toLocaleUpperCase("tr-TR");

  return (
    <View className="relative overflow-hidden rounded-[30px] border border-border-default bg-surface-primary p-5">
      <View className="absolute -right-14 -top-20 h-48 w-48 rounded-full border-[34px] border-brand-primary/10" />
      <View className="absolute right-20 top-7 h-3 w-3 rounded-full bg-brand-primary/30" />

      <View className="flex-row items-start gap-4">
        <View className="h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-brand-primary/30 bg-brand-primary/10">
          <Text className="font-display text-[30px] text-brand-primary">
            {initial || "O"}
          </Text>
        </View>

        <View className="min-w-0 flex-1 pt-0.5">
          <Text
            numberOfLines={2}
            className="font-display text-[26px] leading-8 text-text-primary"
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
            accessibilityLabel="Organizasyon bilgilerini düzenle"
            hitSlop={8}
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
        <Text className="mt-5 font-body text-sm leading-5 text-text-secondary">
          {organization.description}
        </Text>
      ) : (
        <Text className="mt-5 font-body text-sm leading-5 text-text-tertiary">
          Spor topluluğunu büyüt, üyelerini bir araya getir ve etkinliklerini
          birlikte yönet.
        </Text>
      )}

      <View className="mt-5 flex-row border-t border-border-default pt-4">
        <OrganizationStat
          value={organization.approvedMemberCount}
          label="Üye"
          icon="user-group"
        />
        <View className="mx-4 h-9 w-px bg-border-default" />
        <OrganizationStat
          value={eventCount}
          label="Etkinlik"
          icon="calendar-day"
        />
      </View>
    </View>
  );
}

function InfoPill({
  icon,
  label,
}: {
  icon: "shield-halved" | "location-dot";
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-border-default bg-background-secondary/70 px-2.5 py-1.5">
      <FontAwesome6 name={icon} size={9} color={themeColors.brand.primary} />
      <Text className="font-body-bold text-[10px] text-text-secondary">
        {label}
      </Text>
    </View>
  );
}

function OrganizationStat({
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
      <Text className="font-mono-bold text-lg text-text-primary">{value}</Text>
      <View className="mt-0.5 flex-row items-center gap-1.5">
        <FontAwesome6 name={icon} size={9} color={themeColors.brand.primary} />
        <Text className="font-body text-[10px] text-text-tertiary">
          {label}
        </Text>
      </View>
    </View>
  );
}
