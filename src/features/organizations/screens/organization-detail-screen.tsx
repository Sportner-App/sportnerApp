import * as Clipboard from "expo-clipboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  useRefreshableLoad,
  type LoadMode,
} from "@/hooks/use-refreshable-load";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import {
  deleteOrganization,
  getOrganization,
  leaveOrganization,
  listOrganizationEvents,
  listPastOrganizationEvents,
  joinPublicOrganization,
  listOrganizationMembers,
  rotateInviteCode,
} from "@/features/organizations/services/organizations-service";
import type { EventSummary } from "@/features/events/types";
import {
  ORGANIZATION_STATUS,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
} from "@/features/organizations/types";
import { EventCard } from "@/features/events/components/event-card";
import { mapListItemToSummary } from "@/features/events/mappers";
import {
  shareOrganizationInvite,
  shareOrganizationInviteViaWhatsApp,
} from "@/features/organizations/organization-invite";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { resolveRouteParam } from "@/utils/route-params";

import { confirmDestructive } from "@/utils/confirm";
import { OrganizationHero } from "@/features/organizations/components/organization-hero";
import { OrganizationInviteSheet } from "@/features/organizations/components/organization-invite-sheet";
import { OrganizationMemberActions } from "@/features/organizations/components/organization-member-actions";
import { OrganizationMenuSheet } from "@/features/organizations/components/organization-menu-sheet";

const PAST_PAGE_SIZE = 10;
/** Sessiz tazelemede en fazla bu kadar sayfa birden istenir (API üst sınırı 50). */
const MAX_SILENT_PAST_PAGES = 5;

export function OrganizationDetailScreen() {
  const { t } = useTranslation(["organizations", "common"]);
  const router = useRouter();
  const { showToast } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const organizationId = useMemo(() => resolveRouteParam(rawId), [rawId]);
  const [organization, setOrganization] =
    useState<ApiOrganizationDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [pastEvents, setPastEvents] = useState<EventSummary[]>([]);
  const [pastPage, setPastPage] = useState(1);
  const [pastHasMore, setPastHasMore] = useState(false);
  const [isLoadingMorePast, setIsLoadingMorePast] = useState(false);
  const [members, setMembers] = useState<ApiOrganizationMember[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const isDeletingRef = useRef(false);
  // Her `load` sıfırlamasında artar; uçuştaki "daha fazla" isteğini geçersiz kılar.
  const pastGenerationRef = useRef(0);
  // Eski yanıt (başka kulüp ya da işlem öncesi) yenisini ezmesin.
  const requestIdRef = useRef(0);
  const pastPageRef = useRef(pastPage);
  pastPageRef.current = pastPage;
  const { isAuthenticated, requireAuth } = useRequireAuth();

  const load = useCallback(async (mode: LoadMode) => {
    const silent = mode === "silent";
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;
    if (!organizationId) return;
    try {
      const detail = await getOrganization(organizationId);
      if (isStale()) return;
      setOrganization(detail);

      const isMember = detail.myStatus === ORGANIZATION_STATUS.approved;
      const isPending = detail.myStatus === ORGANIZATION_STATUS.pending;

      // Üye olmayan görüntüleyici için API yalnızca açık etkinlikleri döner.
      if (isMember || !isPending) {
        try {
          const organizationEvents =
            await listOrganizationEvents(organizationId);
          if (isStale()) return;
          setEvents(organizationEvents.map(mapListItemToSummary));
        } catch (error) {
          if (!silent && !isStale()) {
            setEvents([]);
            showToast({
              type: "error",
              title: t("organizations:detail.eventsLoadFailed"),
              description: getApiErrorMessage(error),
            });
          }
        }

        if (isStale()) return;
        // Geçmiş etkinlikler yardımcı bir bölüm: yüklenemezse sessizce gizlenir.
        pastGenerationRef.current += 1;
        const generation = pastGenerationRef.current;
        // Sessiz tazelemede yüklü sayfa kadarı tek istekle yeniden çekilir.
        const pages = silent
          ? Math.min(pastPageRef.current, MAX_SILENT_PAST_PAGES)
          : 1;
        try {
          const past = await listPastOrganizationEvents(
            organizationId,
            1,
            pages * PAST_PAGE_SIZE,
          );
          if (generation === pastGenerationRef.current) {
            setPastEvents(past.map(mapListItemToSummary));
            setPastPage(pages);
            setPastHasMore(past.length >= pages * PAST_PAGE_SIZE);
          }
        } catch {
          if (!silent && !isStale()) {
            setPastEvents([]);
            setPastHasMore(false);
          }
        }
      } else {
        pastGenerationRef.current += 1;
        setEvents([]);
        setPastEvents([]);
        setPastHasMore(false);
      }

      if (isMember) {
        try {
          const memberItems = await listOrganizationMembers(organizationId);
          if (isStale()) return;
          setMembers(memberItems);
        } catch (error) {
          if (!silent && !isStale()) {
            setMembers([]);
            showToast({
              type: "error",
              title: t("organizations:detail.membersLoadFailed"),
              description: getApiErrorMessage(error),
            });
          }
        }
      } else {
        setMembers([]);
      }
    } catch (error) {
      const gone =
        isApiError(error) && (error.status === 404 || error.status === 403);
      // Sessiz tazelemede geçici hata eldeki kulübü silmesin.
      if (isStale() || (silent && !gone)) return;
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
    refocusMode: "silent",
    resetKey: organizationId,
  });

  const loadMorePast = async () => {
    if (!organizationId || isLoadingMorePast || !pastHasMore) return;
    const requestedOrganizationId = organizationId;
    const generation = pastGenerationRef.current;
    setIsLoadingMorePast(true);
    try {
      const nextPage = pastPage + 1;
      const more = await listPastOrganizationEvents(
        organizationId,
        nextPage,
        PAST_PAGE_SIZE,
      );
      if (
        generation !== pastGenerationRef.current ||
        requestedOrganizationId !== organizationId
      ) {
        return;
      }
      const mapped = more.map(mapListItemToSummary);
      setPastEvents((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...mapped.filter((item) => !known.has(item.id))];
      });
      setPastPage(nextPage);
      setPastHasMore(more.length >= PAST_PAGE_SIZE);
    } catch (error) {
      if (generation !== pastGenerationRef.current) return;
      showToast({
        type: "error",
        title: t("organizations:detail.pastEventsLoadFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoadingMorePast(false);
    }
  };

  const joinClub = async () => {
    if (!organization || isJoining) return;
    if (!requireAuth(t("organizations:detail.joinAuthReason"))) return;
    setIsJoining(true);
    try {
      await joinPublicOrganization(organization.id);
      showToast({
        type: "success",
        title: t("organizations:detail.joined"),
      });
      await refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.joinFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyCode = async (): Promise<{ ok: boolean }> => {
    if (!organization?.inviteCode) return { ok: false };
    await Clipboard.setStringAsync(organization.inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({
      type: "success",
      title: t("organizations:detail.codeCopied"),
      description: organization.inviteCode,
    });
    return { ok: true };
  };

  const shareCode = async (): Promise<{ ok: boolean }> => {
    if (!organization?.inviteCode) return { ok: false };
    try {
      await shareOrganizationInvite(organization.name, organization.inviteCode);
      return { ok: true };
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.shareFailed"),
        description: getApiErrorMessage(error),
      });
      return { ok: false };
    }
  };

  const shareCodeViaWhatsApp = async (): Promise<{ ok: boolean }> => {
    if (!organization?.inviteCode) return { ok: false };
    try {
      await shareOrganizationInviteViaWhatsApp(
        organization.name,
        organization.inviteCode,
      );
      return { ok: true };
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.whatsappFailed"),
        description: getApiErrorMessage(error),
      });
      return { ok: false };
    }
  };

  const rotateCode = async (): Promise<{ ok: boolean }> => {
    if (!organization) return { ok: false };
    try {
      const next = await rotateInviteCode(organization.id);
      setOrganization(next);
      showToast({
        type: "success",
        title: t("organizations:detail.codeRotated"),
      });
      return { ok: true };
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:detail.codeRotateFailed"),
        description: getApiErrorMessage(error),
      });
      return { ok: false };
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
            router.replace({
              pathname: "/(tabs)/discover",
              params: { mode: "clubs", scope: "mine", ts: String(Date.now()) },
            });
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

  const confirmDelete = () => {
    if (!organization) return;
    confirmDestructive({
      title: t("organizations:detail.deleteTitle"),
      message: t("organizations:detail.deleteMessage"),
      confirmLabel: t("organizations:detail.deleteConfirm"),
      onConfirm: () => {
        if (isDeletingRef.current) return;
        isDeletingRef.current = true;
        void deleteOrganization(organization.id)
          .then(() => {
            showToast({
              type: "success",
              title: t("organizations:detail.deleted"),
            });
            router.replace({
              pathname: "/(tabs)/discover",
              params: { mode: "clubs", scope: "mine", ts: String(Date.now()) },
            });
          })
          .catch((error) => {
            isDeletingRef.current = false;
            showToast({
              type: "error",
              title: t("organizations:detail.deleteFailed"),
              description: getApiErrorMessage(error),
            });
          });
      },
    });
  };

  const openEvent = useCallback(
    (eventId: string) => router.push(`/events/${eventId}`),
    [router],
  );

  // Son 24 saatte başlayan etkinlik iki listede de gelebilir; yaklaşanda kalır.
  const visiblePastEvents = useMemo(() => {
    const upcomingIds = new Set(events.map((event) => event.id));
    return pastEvents.filter((event) => !upcomingIds.has(event.id));
  }, [events, pastEvents]);

  const isMember = organization?.myStatus === ORGANIZATION_STATUS.approved;
  const isPendingMember =
    organization?.myStatus === ORGANIZATION_STATUS.pending;

  const openMembers = (forceMembersTab = false) => {
    if (!organization) return;
    router.push({
      pathname: "/clubs/[id]/members",
      params: {
        id: organization.id,
        tab:
          !forceMembersTab &&
          organization.canManageMembers &&
          organization.pendingMemberCount > 0
            ? "pending"
            : "members",
      },
    });
  };

  const showMenu =
    organization != null &&
    (organization.canUpdateDetails ||
      organization.canLeave ||
      organization.canDelete ||
      organization.canTransferFounder);

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t("organizations:detail.title")}
          showBack
          right={
            showMenu ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("organizations:detail.menuA11y")}
                hitSlop={HIT_SLOP}
                onPress={() => setMenuOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
              >
                <FontAwesome6
                  name="ellipsis"
                  size={14}
                  color={themeColors.brand.primary}
                />
              </Pressable>
            ) : undefined
          }
        />
      }
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
            completedEventCount={organization.completedEventCount}
            onPressMembers={isMember ? () => openMembers() : undefined}
          />

          {isPendingMember ? (
            <View>
              <Text className="font-body-bold text-body-sm text-text-primary">
                {t("organizations:detail.pendingTitle")}
              </Text>
              <Text className="mt-1 font-body text-body-sm text-text-secondary">
                {t("organizations:detail.pendingDescription")}
              </Text>
            </View>
          ) : !isMember ? (
            <>
              {organization.canJoin ||
              (!isAuthenticated && organization.isPublic) ? (
                <Button
                  label={t("organizations:detail.join")}
                  onPress={() => void joinClub()}
                  isLoading={isJoining}
                  disabled={isJoining}
                />
              ) : !organization.isPublic ? (
                <View className="gap-3">
                  <Text className="font-body text-body-sm text-text-secondary">
                    {t("organizations:detail.privateCannotJoin")}
                  </Text>
                  <Button
                    label={t("organizations:detail.joinWithInviteCode")}
                    onPress={() => {
                      if (
                        requireAuth(t("organizations:detail.joinAuthReason"))
                      ) {
                        router.push("/clubs/join");
                      }
                    }}
                  />
                </View>
              ) : null}

              {events.length > 0 ? (
                <>
                  <Text className="font-display text-heading-sm text-text-primary">
                    {t("organizations:detail.openEventsTitle")}
                  </Text>
                  {events.slice(0, 5).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPressEvent={openEvent}
                    />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <>
              <OrganizationMemberActions
                members={members}
                approvedCount={organization.approvedMemberCount}
                pendingCount={
                  organization.canManageMembers
                    ? organization.pendingMemberCount
                    : 0
                }
                onPressMembers={() => openMembers()}
                inviteEnabled={Boolean(organization.inviteCode)}
                onPressInvite={() => setInviteOpen(true)}
              />

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
                <>
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPressEvent={openEvent}
                    />
                  ))}
                </>
              )}
            </>
          )}
          {!isPendingMember && visiblePastEvents.length > 0 ? (
            <>
              <Text className="mt-2 font-display text-heading-sm text-text-primary">
                {t("organizations:detail.pastEventsTitle")}
              </Text>
              {visiblePastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPressEvent={openEvent}
                />
              ))}
              {pastHasMore ? (
                <Button
                  label={t("organizations:detail.pastEventsMore")}
                  variant="outline"
                  size="sm"
                  onPress={() => void loadMorePast()}
                  isLoading={isLoadingMorePast}
                  disabled={isLoadingMorePast}
                />
              ) : null}
            </>
          ) : null}
          <OrganizationMenuSheet
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            organizationName={organization.name}
            imageUrl={organization.imageUrl}
            myRole={organization.myRole}
            canEdit={organization.canUpdateDetails}
            canLeave={organization.canLeave}
            canTransferFounder={organization.canTransferFounder}
            canDelete={organization.canDelete}
            onEdit={() => router.push(`/clubs/${organization.id}/edit`)}
            onLeave={confirmLeave}
            onTransferFounder={() => openMembers(true)}
            onDelete={confirmDelete}
          />
          {organization.inviteCode ? (
            <OrganizationInviteSheet
              visible={inviteOpen}
              onClose={() => setInviteOpen(false)}
              organizationName={organization.name}
              inviteCode={organization.inviteCode}
              canRotate={organization.canRotateInviteCode}
              onCopy={copyCode}
              onShare={shareCode}
              onShareWhatsApp={shareCodeViaWhatsApp}
              onRotate={rotateCode}
            />
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
