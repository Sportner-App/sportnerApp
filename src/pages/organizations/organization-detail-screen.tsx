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
import { EventCard } from "@/pages/home/event-card";
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
  const [organization, setOrganization] = useState<ApiOrganizationDetail | null>(
    null,
  );
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
          const [eventsResult, membersResult] = await Promise.allSettled([
            listOrganizationEvents(organizationId),
            listOrganizationMembers(organizationId),
          ]);

          if (eventsResult.status === "fulfilled") {
            setEvents(eventsResult.value.map(mapListItemToSummary));
          } else {
            setEvents([]);
            showToast({
              type: "error",
              title: "Etkinlikler yüklenemedi",
              description: getApiErrorMessage(eventsResult.reason),
            });
          }

          if (membersResult.status === "fulfilled") {
            setMembers(membersResult.value);
          } else {
            setMembers([]);
            showToast({
              type: "error",
              title: "Üyeler yüklenemedi",
              description: getApiErrorMessage(membersResult.reason),
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
          <Text className="font-display text-3xl text-text-primary">
            {organization.name}
          </Text>
          {organization.cityName ? (
            <Text className="font-body text-sm text-text-secondary">
              {organization.cityName}
            </Text>
          ) : null}
          {organization.description ? (
            <Text className="font-body text-sm text-text-secondary">
              {organization.description}
            </Text>
          ) : null}
          {organization.canUpdateDetails ? (
            <Button
              label="Bilgileri düzenle"
              variant="outline"
              size="sm"
              onPress={() => router.push(`/organizations/${organization.id}/edit`)}
            />
          ) : null}

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
                events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onPress={() => router.push(`/events/${event.id}`)}
                  />
                ))
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
                    onPressProfile={() => router.push(`/users/${member.userId}`)}
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
