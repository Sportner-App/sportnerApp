import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useEventDetail } from "@/hooks/use-event-detail";
import { canAccessEventChat } from "@/utils/events";

import { AboutSection } from "./about-section";
import { DetailHero } from "./detail-hero";
import { InfoGrid } from "./info-grid";
import { JoinBar } from "./join-bar";
import { LocationMap } from "./location-map";
import { OrganizerPanel } from "./organizer-panel";
import { ParticipantsCard } from "./participants-card";

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useEventDetail(id);

  const openChat = () => {
    if (detail.event?.conversationId) {
      router.push(`/events/${detail.event.id}/chat`);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="ETKİNLİK" showBack />}
      belowHeader={<LinearRefreshBar visible={detail.isRefreshing} />}
      contentClassName="flex-grow gap-4 px-6 pt-3"
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
          />
        ) : null
      }
    >
      {detail.isLoading ? (
        <View className="flex-1 items-center justify-center pb-16">
          <SportLoader size={148} label="Detaylar yükleniyor" />
        </View>
      ) : !detail.event ? (
        <View className="items-center gap-4 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-16">
          <FontAwesome6 name="calendar-xmark" size={24} color="#64748b" />
          <Text className="font-body text-sm text-brand-neutral">
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
          <DetailHero event={detail.event} />
          <InfoGrid event={detail.event} />
          <LocationMap event={detail.event} />
          <ParticipantsCard
            event={detail.event}
            onOpenUser={(userId) => router.push(`/users/${userId}`)}
            onOpenChat={
              canAccessEventChat(
                detail.event.myParticipationStatus,
                detail.isOrganizer,
                detail.event.conversationId,
                detail.event.status,
              )
                ? openChat
                : undefined
            }
            onOpenReviews={() => router.push(`/events/${detail.event?.id}/reviews`)}
          />
          {detail.isOrganizer ? (
            <OrganizerPanel
              event={detail.event}
              canManage={detail.canManage}
              canComplete={detail.canComplete}
              canTakeAttendance={detail.canTakeAttendance}
              busyUserId={detail.busyUserId}
              isMutating={detail.isMutating}
              onApprove={detail.approve}
              onReject={detail.reject}
              onPromote={detail.promote}
              onAttended={detail.markAttended}
              onAbsent={detail.markAbsent}
              onCancel={detail.cancel}
              onComplete={detail.complete}
              onEdit={() => router.push(`/events/${detail.event?.id}/edit`)}
              onOpenUser={(userId) => router.push(`/users/${userId}`)}
            />
          ) : null}
          <AboutSection event={detail.event} />
          {!detail.isOrganizer ? (
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
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
