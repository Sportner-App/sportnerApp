import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, Share, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
  UserIdentity,
} from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { EventCard } from "@/pages/home/event-card";
import {
  approveOrganizationMember,
  blockOrganizationMember,
  getOrganization,
  leaveOrganization,
  listBlockedOrganizationMembers,
  listOrganizationEvents,
  listOrganizationMembers,
  rejectOrganizationMember,
  removeOrganizationMember,
  rotateInviteCode,
  unblockOrganizationMember,
  updateOrganizationMemberRole,
} from "@/services/organizations-service";
import type { EventSummary } from "@/types/events";
import {
  canModerateOrganizationMember,
  ORGANIZATION_ROLE,
  ORGANIZATION_STATUS,
  organizationRoleLabel,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
} from "@/types/organizations";
import { mapListItemToSummary } from "@/utils/events";

export function OrganizationDetailScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [organization, setOrganization] = useState<ApiOrganizationDetail | null>(
    null,
  );
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [members, setMembers] = useState<ApiOrganizationMember[]>([]);
  const [blockedMembers, setBlockedMembers] = useState<ApiOrganizationMember[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!id) return;
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const detail = await getOrganization(id);
        setOrganization(detail);
        if (detail.myStatus === ORGANIZATION_STATUS.approved) {
          const [eventItems, memberItems, blockedItems] = await Promise.all([
            listOrganizationEvents(id),
            listOrganizationMembers(id),
            detail.canManageMembers
              ? listBlockedOrganizationMembers(id)
              : Promise.resolve([]),
          ]);
          setEvents(eventItems.map(mapListItemToSummary));
          setMembers(memberItems);
          setBlockedMembers(blockedItems);
        } else {
          setEvents([]);
          setMembers([]);
          setBlockedMembers([]);
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
    [id, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load("initial");
    }, [load]),
  );

  const shareCode = async () => {
    if (!organization?.inviteCode) return;
    await Share.share({
      message: `${organization.name} davet kodu: ${organization.inviteCode}`,
    });
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

  const runMemberAction = async (
    userId: string,
    action: () => Promise<void>,
  ) => {
    setBusyUserId(userId);
    try {
      await action();
      await load("refresh");
    } catch (error) {
      showToast({
        type: "error",
        title: "İşlem yapılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setBusyUserId(null);
    }
  };

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
                  <Text className="mt-1 font-mono text-2xl text-text-primary">
                    {organization.inviteCode}
                  </Text>
                  <View className="mt-3 flex-row gap-2">
                    <View className="flex-1">
                      <Button label="Paylaş" size="sm" onPress={shareCode} />
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

              <Text className="font-display text-lg text-text-primary">
                Üyeler
              </Text>
              {members.map((member) => (
                <View
                  key={member.userId}
                  className="rounded-2xl border border-border-default bg-surface-primary p-3"
                >
                  <UserIdentity
                    username={member.username}
                    avatarUrl={member.profileImageUrl}
                    fallbackName={member.firstName}
                    onPress={() => router.push(`/users/${member.userId}`)}
                  />
                  <Text className="mt-2 font-body text-xs text-text-tertiary">
                    {member.status === ORGANIZATION_STATUS.pending
                      ? "Onay bekliyor"
                      : organizationRoleLabel(member.role)}
                  </Text>
                  {organization.canManageMembers
                  && member.status === ORGANIZATION_STATUS.pending ? (
                    <View className="mt-3 flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Onayla"
                          size="sm"
                          disabled={busyUserId === member.userId}
                          isLoading={busyUserId === member.userId}
                          onPress={() =>
                            void runMemberAction(member.userId, async () => {
                              await approveOrganizationMember(
                                organization.id,
                                member.userId,
                              );
                            })
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Reddet"
                          variant="outline"
                          size="sm"
                          disabled={busyUserId === member.userId}
                          onPress={() =>
                            void runMemberAction(member.userId, async () => {
                              await rejectOrganizationMember(
                                organization.id,
                                member.userId,
                              );
                            })
                          }
                        />
                      </View>
                    </View>
                  ) : null}
                  {organization.canRotateInviteCode
                  && member.role !== ORGANIZATION_ROLE.founder
                  && member.status === ORGANIZATION_STATUS.approved ? (
                    <View className="mt-3">
                      <Button
                        label={
                          member.role === ORGANIZATION_ROLE.admin
                            ? "Yöneticiliği kaldır"
                            : "Yönetici yap"
                        }
                        variant="ghost"
                        size="sm"
                        disabled={busyUserId === member.userId}
                        onPress={() =>
                          void runMemberAction(member.userId, async () => {
                            await updateOrganizationMemberRole(
                              organization.id,
                              member.userId,
                              member.role === ORGANIZATION_ROLE.admin
                                ? ORGANIZATION_ROLE.member
                                : ORGANIZATION_ROLE.admin,
                            );
                          })
                        }
                      />
                    </View>
                  ) : null}
                  {organization.canManageMembers
                  && member.status === ORGANIZATION_STATUS.approved
                  && canModerateOrganizationMember(
                    organization.myRole,
                    user?.id,
                    member,
                  ) ? (
                    <View className="mt-3 flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Çıkar"
                          variant="outline"
                          size="sm"
                          disabled={busyUserId === member.userId}
                          onPress={() =>
                            Alert.alert(
                              "Üyeyi çıkar",
                              "Kişi organizasyondan çıkarılır. İsterse davet koduyla tekrar başvurabilir.",
                              [
                                { text: "Vazgeç", style: "cancel" },
                                {
                                  text: "Çıkar",
                                  style: "destructive",
                                  onPress: () =>
                                    void runMemberAction(member.userId, async () => {
                                      await removeOrganizationMember(
                                        organization.id,
                                        member.userId,
                                      );
                                    }),
                                },
                              ],
                            )
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Engelle"
                          variant="danger"
                          size="sm"
                          disabled={busyUserId === member.userId}
                          onPress={() =>
                            Alert.alert(
                              "Üyeyi engelle",
                              "Engellenen kişi davet koduyla tekrar katılamaz. İstersen sonra engeli kaldırırsın.",
                              [
                                { text: "Vazgeç", style: "cancel" },
                                {
                                  text: "Engelle",
                                  style: "destructive",
                                  onPress: () =>
                                    void runMemberAction(member.userId, async () => {
                                      await blockOrganizationMember(
                                        organization.id,
                                        member.userId,
                                      );
                                    }),
                                },
                              ],
                            )
                          }
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}

              {organization.canManageMembers ? (
                <>
                  <Text className="font-display text-lg text-text-primary">
                    Engellenenler
                  </Text>
                  {blockedMembers.length === 0 ? (
                    <Text className="font-body text-sm text-text-tertiary">
                      Engellenen kimse yok.
                    </Text>
                  ) : (
                    blockedMembers.map((member) => (
                      <View
                        key={member.userId}
                        className="rounded-2xl border border-border-default bg-surface-primary p-3"
                      >
                        <UserIdentity
                          username={member.username}
                          avatarUrl={member.profileImageUrl}
                          fallbackName={member.firstName}
                          onPress={() => router.push(`/users/${member.userId}`)}
                        />
                        <View className="mt-3">
                          <Button
                            label="Engeli kaldır"
                            variant="outline"
                            size="sm"
                            disabled={busyUserId === member.userId}
                            isLoading={busyUserId === member.userId}
                            onPress={() =>
                              void runMemberAction(member.userId, async () => {
                                await unblockOrganizationMember(
                                  organization.id,
                                  member.userId,
                                );
                              })
                            }
                          />
                        </View>
                      </View>
                    ))
                  )}
                </>
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
