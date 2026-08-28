import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { radius, spacing, themeColors } from "@/constants/theme";
import { useEventDetail } from "@/hooks/use-event-detail";
import { EVENT_STATUS, PARTICIPANT_STATUS } from "@/types/events";
import { hasApprovedParticipation, hasEventEnded } from "@/utils/events";

import { AboutSection } from "./about-section";
import { EventDetailHero } from "./event-detail-hero";
import { EventOrganizerSection } from "./event-organizer-section";
import { EventPrimaryInfo } from "./event-primary-info";
import { JoinBar } from "./join-bar";
import { LeaveEventAction } from "./leave-event-action";
import { LocationMap } from "./location-map";
import { OrganizerPanel } from "./organizer-panel";
import { PendingRequestsSheet } from "./pending-requests-sheet";

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useEventDetail(id);

  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);

  const pendingCount = detail.isOrganizer
    ? (detail.event?.participants.filter(
        (item) =>
          !item.isGuest &&
          item.userId != null &&
          item.status === PARTICIPANT_STATUS.pending,
      ).length ?? 0)
    : 0;
  const showPendingEntry = pendingCount > 0;

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
      tone="light"
      edgeToEdgeTop={Boolean(detail.event)}
      header={
        detail.isLoading || !detail.event ? (
          <ScreenHeader showBack tone="light" />
        ) : undefined
      }
      belowHeader={<LinearRefreshBar visible={detail.isRefreshing} />}
      contentClassName="flex-grow"
      refreshControl={
        <BrandRefreshControl
          refreshing={detail.isRefreshing}
          onRefresh={detail.refresh}
        />
      }
      footer={
        !detail.isLoading && detail.event ? (
          <JoinBar
            event={detail.event}
            hasJoined={detail.hasJoined}
            isJoining={detail.isJoining}
            isLeaving={detail.isLeaving}
            isFull={detail.isFull}
            isOrganizer={detail.isOrganizer}
            onJoin={detail.join}
            onLeave={detail.leave}
            onChat={openChat}
            isRespondingInvitation={detail.isRespondingInvitation}
            onAcceptInvitation={detail.acceptInvitation}
            onDeclineInvitation={detail.declineInvitation}
          />
        ) : null
      }
    >
      <StatusBar style="light" />
      {detail.isLoading ? (
        <View className="flex-1 items-center justify-center pb-16">
          <SportLoader size={148} label="Detaylar yükleniyor" />
        </View>
      ) : !detail.event ? (
        <View className="items-center gap-4 rounded-xlarge bg-surface-primary px-6 py-16">
          <FontAwesome6
            name="calendar-xmark"
            size={24}
            color={themeColors.text.secondary}
          />
          <Text className="font-body text-sm text-text-secondary">
            Etkinlik bulunamadı veya kaldırılmış.
          </Text>
          <Button
            label="Geri Dön"
            variant="outline"
            size="sm"
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <>
          <EventDetailHero
            event={detail.event}
            onBack={() => router.back()}
            pendingCount={showPendingEntry ? pendingCount : 0}
            onPendingPress={
              showPendingEntry ? handleOpenPendingRequests : undefined
            }
          />

          <View
            style={{
              marginTop: -spacing.lg,
              backgroundColor: themeColors.surface.primary,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.lg,
              paddingHorizontal: spacing.xl,
            }}
          >
            <EventPrimaryInfo
              event={detail.event}
              onOpenParticipants={() =>
                router.push(`/events/${detail.event?.id}/participants`)
              }
              onOpenReviews={
                detail.event.status === EVENT_STATUS.completed
                  ? () => router.push(`/events/${detail.event?.id}/reviews`)
                  : undefined
              }
            />

            <SectionDivider />

            <EventOrganizerSection
              event={detail.event}
              isOrganizer={detail.isOrganizer}
              onOpenUser={(userId) => router.push(`/users/${userId}`)}
              onChat={openChat}
            />

            {detail.isOrganizer ? (
              <View className="mt-lg">
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
                  onCancel={detail.cancel}
                  onEdit={() => router.push(`/events/${detail.event?.id}/edit`)}
                  onOpenUser={(userId) => router.push(`/users/${userId}`)}
                  onOpenReviews={() =>
                    router.push(`/events/${detail.event?.id}/reviews`)
                  }
                  onRateUser={(userId) => {
                    if (!detail.event) {
                      return;
                    }
                    router.push({
                      pathname: "/events/[id]/reviews",
                      params: { id: detail.event.id, userId },
                    });
                  }}
                />
              </View>
            ) : null}

            <SectionDivider />

            <AboutSection event={detail.event} />

            <SectionDivider />

            <LocationMap event={detail.event} />

            {!detail.isOrganizer &&
            hasApprovedParticipation(detail.event.myParticipationStatus) &&
            !hasEventEnded(detail.event) ? (
              <View className="mt-lg">
                <LeaveEventAction
                  isLeaving={detail.isLeaving}
                  onLeave={detail.leave}
                />
              </View>
            ) : null}

            {!detail.isOrganizer ? (
              <View className="mt-sm">
                <Button
                  label="Şikayet et"
                  variant="ghost"
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
              </View>
            ) : null}
          </View>
        </>
      )}
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
    </AppScreen>
  );
}

function SectionDivider() {
  return (
    <View
      className="my-lg h-px w-full"
      style={{ backgroundColor: themeColors.border.default }}
    />
  );
}
