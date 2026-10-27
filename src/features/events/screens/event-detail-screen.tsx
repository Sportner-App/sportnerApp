import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  BottomSheet,
  brandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { spacing, themeColors } from "@/constants/theme";
import { useEventDetail } from "@/features/events/hooks/use-event-detail";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useScrollToSection } from "@/hooks/use-scroll-to-section";
import { confirmDestructive } from "@/utils/confirm";
import { EVENT_STATUS, PARTICIPANT_STATUS } from "@/features/events/types";
import {
  hasApprovedParticipation,
  hasEventEnded,
} from "@/features/events/status";

import { AboutSection } from "@/features/events/components/detail/about-section";
import { BirthDateRequiredSheet } from "@/features/events/components/detail/birth-date-required-sheet";
import { GenderRequiredSheet } from "@/features/events/components/detail/gender-required-sheet";
import { EventQnASection } from "@/features/events/components/detail/event-qna-section";
import { EventDetailBackdrop } from "@/features/events/components/detail/event-detail-backdrop";
import {
  EVENT_DETAIL_TOP_BAR_HEIGHT,
  EventDetailBadges,
  EventDetailTopBar,
} from "@/features/events/components/detail/event-detail-top-bar";
import { EventOrganizerSection } from "@/features/events/components/detail/event-organizer-section";
import { EventParticipantsTab } from "@/features/events/components/detail/event-participants-tab";
import { EventPrimaryInfo } from "@/features/events/components/detail/event-primary-info";
import { EventShareSheet } from "@/features/events/components/detail/event-share-sheet";
import { JoinBar } from "@/features/events/components/detail/join-bar";
import { LeaveEventAction } from "@/features/events/components/detail/leave-event-action";
import { LocationMap } from "@/features/events/components/detail/location-map";
import { OrganizerPanel } from "@/features/events/components/detail/organizer-panel";
import { PendingRequestsSheet } from "@/features/events/components/detail/pending-requests-sheet";

type EventDetailTab = "overview" | "participants" | "questions";

export function EventDetailScreen() {
  const { t } = useTranslation("eventDetail");
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const router = useRouter();
  const detail = useEventDetail(id);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<EventDetailTab>("overview");

  const scrollRef = useRef<ScrollView>(null);
  const { registerSection, scrollToSection } = useScrollToSection(scrollRef);
  const hasAppliedFocusRef = useRef(false);

  useEffect(() => {
    if (
      (focus !== "questions" && focus !== "attendance") ||
      hasAppliedFocusRef.current ||
      detail.isLoading ||
      !detail.event
    ) {
      return;
    }
    hasAppliedFocusRef.current = true;
    // Yoklama, organizatör panelinin içinde; panel de katılımcılar sekmesinde
    // duruyor. Sekme gizliyken (display: none) sheet de görünmüyor, bu yüzden
    // önce sekmeyi açıyoruz.
    setActiveTab(focus === "attendance" ? "participants" : "questions");
    const timeout = setTimeout(() => scrollToSection("tabs"), 250);
    return () => clearTimeout(timeout);
  }, [detail.event, detail.isLoading, focus, scrollToSection]);

  /**
   * "Yoklama bekliyor" bildirimi etkinliğe değil, organizatörün yoklama
   * sheet'ine işaret ediyor; sheet organizatör panelinin içinde olduğu için
   * istek oraya aktarılıyor. Yoklama alınamıyorsa (ör. etkinlik henüz
   * bitmemiş) sekme de yok, o yüzden sessizce yok sayılıyor.
   */
  const organizerAutoOpenTab =
    focus === "attendance" &&
    detail.canTakeAttendance &&
    activeTab === "participants"
      ? "attendance"
      : null;

  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [organizerMenuOpen, setOrganizerMenuOpen] = useState(false);

  /**
   * İptal geri alınamıyor ve katılımcıların hepsine bildirim gidiyor; tek
   * dokunuşla tetiklenmesi doğru değil.
   */
  const confirmCancelEvent = () => {
    const others = (detail.event?.participants ?? []).filter(
      (participant) => participant.userId !== detail.event?.organizerUserId,
    ).length;

    confirmDestructive({
      title: t("organizerPanel.cancelConfirmTitle"),
      message:
        others > 0
          ? t("organizerPanel.cancelConfirmWithParticipants", { count: others })
          : t("organizerPanel.cancelConfirmAlone"),
      confirmLabel: t("organizerPanel.cancelConfirmAction"),
      cancelLabel: t("common:cancel"),
      onConfirm: detail.cancel,
    });
  };
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const pendingCount = detail.isOrganizer
    ? (detail.event?.participants.filter(
        (item) =>
          !item.isGuest &&
          item.userId != null &&
          item.status === PARTICIPANT_STATUS.pending,
      ).length ?? 0)
    : 0;
  const showPendingEntry = pendingCount > 0;
  // Katılım rozetini organizatöre göstermiyoruz (onun bar'ı kontenjanı yazıyor) ve
  // biten etkinlikte "Etkinlik bitti" bilgisi bar'da kalmaya devam ediyor.
  const showJoinedBadge = Boolean(
    detail.event &&
    !detail.isOrganizer &&
    hasApprovedParticipation(detail.event.myParticipationStatus) &&
    !hasEventEnded(detail.event),
  );

  const handleOpenPendingRequests = () => {
    if (!detail.isOrganizer) {
      return;
    }
    setPendingSheetOpen(true);
  };

  const openChat = () => {
    if (detail.event?.conversationId) {
      router.push(`/events/${detail.event.id}/chat`);
    }
  };

  return (
    <AppScreen
      scrollRef={scrollRef}
      tone="light"
      edgeToEdgeTop={Boolean(detail.event)}
      headerOverlay={Boolean(detail.event)}
      background={
        detail.event ? <EventDetailBackdrop event={detail.event} /> : undefined
      }
      header={
        detail.isLoading || !detail.event ? (
          <ScreenHeader showBack tone="light" />
        ) : (
          <EventDetailTopBar
            onBack={() => router.back()}
            joinedLabel={showJoinedBadge ? t("join.joined") : undefined}
            pendingCount={showPendingEntry ? pendingCount : 0}
            onPendingPress={
              showPendingEntry ? handleOpenPendingRequests : undefined
            }
            onMenu={
              detail.canManage ? () => setOrganizerMenuOpen(true) : undefined
            }
          />
        )
      }
      belowHeader={<LinearRefreshBar visible={detail.isRefreshing} />}
      contentClassName="flex-grow"
      contentContainerStyle={detail.event ? { paddingBottom: 0 } : undefined}
      refreshControl={brandRefreshControl({
        refreshing: detail.isRefreshing,
        onRefresh: detail.refresh,
      })}
      footer={
        !detail.isLoading && detail.event ? (
          <JoinBar
            event={detail.event}
            hasJoined={detail.hasJoined}
            isJoining={detail.isJoining}
            isLeaving={detail.isLeaving}
            isFull={detail.isFull}
            isOrganizer={detail.isOrganizer}
            onJoin={() =>
              requireAuth(t("requireAuth.join")) && void detail.join()
            }
            onLeave={detail.leave}
            onChat={() => requireAuth(t("requireAuth.chat")) && openChat()}
            onShare={() => setShareSheetOpen(true)}
            isRespondingInvitation={detail.isRespondingInvitation}
            onAcceptInvitation={detail.acceptInvitation}
            onDeclineInvitation={detail.declineInvitation}
          />
        ) : null
      }
    >
      <StatusBar style="light" />
      {detail.isLoading ? (
        <ScreenLoader
          label={t("loading")}
          className="flex-1 items-center justify-center pb-16"
          size={148}
        />
      ) : !detail.event ? (
        <View className="items-center gap-4 rounded-xlarge bg-surface-primary px-6 py-16">
          <FontAwesome6
            name="calendar-xmark"
            size={24}
            color={themeColors.text.secondary}
          />
          <Text className="font-body text-body-sm text-text-secondary">
            {t("notFound")}
          </Text>
          <Button
            label={t("goBack")}
            variant="outline"
            size="sm"
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <View className="flex-1">
          {/* Başlık bloğu doğrudan fotoğrafın üzerinde durur; kart yok, yer kazanıyoruz. */}
          <View
            style={{
              paddingTop: insets.top + EVENT_DETAIL_TOP_BAR_HEIGHT,
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.xl,
              gap: spacing.md,
            }}
          >
            <EventDetailBadges event={detail.event} />

            <EventPrimaryInfo
              event={detail.event}
              isOrganizer={detail.isOrganizer}
              onMedia
              onOpenParticipants={() =>
                router.push(`/events/${detail.event?.id}/participants`)
              }
              onOpenReviews={
                detail.event.status === EVENT_STATUS.completed
                  ? () => router.push(`/events/${detail.event?.id}/reviews`)
                  : undefined
              }
            />
          </View>

          {/* Sekmeler ve altı da doğrudan fotoğrafın üzerinde; ayrı bir panel zemini yok. */}
          <View
            className="flex-1"
            style={{
              paddingBottom: spacing.lg + spacing["2xl"],
              paddingHorizontal: spacing.xl,
            }}
          >
            <View ref={registerSection("tabs")}>
              <SegmentedTabs
                options={[
                  { key: "overview", label: t("tabs.overview") },
                  { key: "participants", label: t("tabs.participants") },
                  { key: "questions", label: t("tabs.questions") },
                ]}
                value={activeTab}
                onChange={setActiveTab}
                indicatorMotion="timing"
                translucent
              />
            </View>

            <View
              className="mt-lg gap-lg"
              style={{ display: activeTab === "overview" ? "flex" : "none" }}
            >
              <View className="rounded-3xl border border-white/10 bg-background-secondary/55 p-4">
                <EventOrganizerSection
                  event={detail.event}
                  isOrganizer={detail.isOrganizer}
                  onOpenUser={(userId) => router.push(`/users/${userId}`)}
                  onChat={openChat}
                />
              </View>

              <View className="rounded-3xl border border-white/10 bg-background-secondary/55 p-4">
                <AboutSection event={detail.event} />
              </View>

              <LocationMap event={detail.event} />

              {!detail.isOrganizer &&
              hasApprovedParticipation(detail.event.myParticipationStatus) &&
              !hasEventEnded(detail.event) ? (
                <LeaveEventAction
                  isLeaving={detail.isLeaving}
                  onLeave={detail.leave}
                />
              ) : null}

              {!detail.isOrganizer && detail.canCancel ? (
                <Button
                  label={t("closeEvent")}
                  variant="danger"
                  onPress={detail.cancel}
                  isLoading={detail.isMutating}
                  disabled={detail.isMutating}
                />
              ) : null}

              {!detail.isOrganizer && isAuthenticated ? (
                <Button
                  label={t("report")}
                  variant="dangerOutline"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: "/report",
                      params: {
                        entityType: "1",
                        entityId: detail.event?.id,
                      },
                    })
                  }
                />
              ) : null}
            </View>

            <View
              className="mt-lg gap-lg"
              style={{
                display: activeTab === "participants" ? "flex" : "none",
              }}
            >
              <EventParticipantsTab
                event={detail.event}
                pendingCount={pendingCount}
                onOpenPendingRequests={handleOpenPendingRequests}
                onOpenUser={(userId) => router.push(`/users/${userId}`)}
              />

              {detail.isOrganizer ? (
                <OrganizerPanel
                  event={detail.event}
                  canManage={detail.canManage}
                  canTakeAttendance={detail.canTakeAttendance}
                  busyUserId={detail.busyUserId}
                  isMutating={detail.isMutating}
                  onApprove={detail.approve}
                  onReject={detail.reject}
                  onPromote={detail.promote}
                  onAttended={detail.markAttended}
                  onAbsent={detail.markAbsent}
                  onCancel={confirmCancelEvent}
                  onEdit={() => router.push(`/events/${detail.event?.id}/edit`)}
                  onOpenUser={(userId) => router.push(`/users/${userId}`)}
                  onOpenReviews={() =>
                    router.push(`/events/${detail.event?.id}/reviews`)
                  }
                  autoOpenTab={organizerAutoOpenTab}
                  onRateUser={(userId) => {
                    if (!detail.event) return;
                    router.push({
                      pathname: "/events/[id]/reviews",
                      params: { id: detail.event.id, userId },
                    });
                  }}
                />
              ) : null}
            </View>

            <View
              className="mt-lg"
              style={{ display: activeTab === "questions" ? "flex" : "none" }}
            >
              <EventQnASection
                event={detail.event}
                isOrganizer={detail.isOrganizer}
                onOpenUser={(userId) => router.push(`/users/${userId}`)}
              />
            </View>
          </View>
        </View>
      )}
      {detail.event && detail.canManage ? (
        <BottomSheet
          visible={organizerMenuOpen}
          onClose={() => setOrganizerMenuOpen(false)}
          title={t("organizerPanel.menuTitle")}
          subtitle={detail.event.title}
        >
          <View className="gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOrganizerMenuOpen(false);
                router.push(`/events/${detail.event?.id}/edit`);
              }}
              className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-4 active:bg-surface-secondary"
            >
              <FontAwesome6
                name="pen"
                size={15}
                color={themeColors.text.secondary}
              />
              <Text className="flex-1 font-body text-body text-text-primary">
                {t("organizerPanel.edit")}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: detail.isMutating }}
              disabled={detail.isMutating}
              onPress={() => {
                setOrganizerMenuOpen(false);
                confirmCancelEvent();
              }}
              className="flex-row items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-4 active:opacity-70"
            >
              <FontAwesome6
                name="calendar-xmark"
                size={15}
                color={themeColors.destructive}
              />
              <Text className="flex-1 font-body text-body text-destructive">
                {detail.isMutating
                  ? t("organizerPanel.cancelling")
                  : t("organizerPanel.cancelEvent")}
              </Text>
            </Pressable>
          </View>
        </BottomSheet>
      ) : null}
      {detail.event && detail.isOrganizer ? (
        <PendingRequestsSheet
          visible={pendingSheetOpen}
          event={detail.event}
          busyUserId={detail.busyUserId}
          onClose={() => setPendingSheetOpen(false)}
          onApprove={detail.approve}
          onReject={detail.reject}
          onOpenUser={(userId) => {
            setPendingSheetOpen(false);
            router.push(`/users/${userId}`);
          }}
        />
      ) : null}
      {detail.event ? (
        <EventShareSheet
          visible={shareSheetOpen}
          event={detail.event}
          onClose={() => setShareSheetOpen(false)}
        />
      ) : null}
      <BirthDateRequiredSheet
        visible={detail.promptedDetail === "birthDate"}
        onClose={detail.closeDetailPrompt}
        onSubmit={detail.submitBirthDate}
      />
      <GenderRequiredSheet
        visible={detail.promptedDetail === "gender"}
        onClose={detail.closeDetailPrompt}
        onSubmit={detail.submitGender}
      />
    </AppScreen>
  );
}
