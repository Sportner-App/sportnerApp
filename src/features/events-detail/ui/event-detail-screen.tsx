import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import {
  formatEventDate,
  getInitials,
  getSkillLabel,
} from "@/features/events-detail/model/field-utils";
import { useEventDetail } from "@/features/events-detail/model/use-event-detail";
import { colorPalette } from "@/shared/config/colors";
import { DynamicIcon } from "@/shared/ui/dynamic-icon";
import { Screen } from "@/shared/ui/screen";
import { useToast } from "@/shared/ui/toast-provider";
import { TacticalLineup } from "./participant-slots";

export function EventDetailScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const {
    event,
    approvedParticipants,
    pendingParticipants,
    approvedCount,
    maxPlayers,
    isOrganizer,
    pendingRequestCount,
    currentUserStatus,
    isLoading,
    isActionLoading,
    activeRequestId,
    error,
    refetch,
    requestToJoin,
    leaveFromEvent,
    cancelPendingRequest,
    approveRequest,
    rejectRequest,
  } = useEventDetail(eventId);

  const hasEventLocation =
    typeof event?.latitude === "number" && typeof event?.longitude === "number";

  const handleRequestToJoin = async () => {
    const { error: actionError } = await requestToJoin();

    if (actionError) {
      showToast({
        type: "error",
        title: "Basvuru gonderilemedi",
        description: actionError.message,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Basvuru gonderildi",
      description: "Organizator onayindan sonra kadroya ekleneceksin.",
    });
  };

  const handleLeaveEvent = async () => {
    const { error: actionError } = await leaveFromEvent();

    if (actionError) {
      showToast({
        type: "error",
        title: "Ayrilma basarisiz",
        description: actionError.message,
      });
      return;
    }

    showToast({
      type: "info",
      title: "Kadrodan ayrildin",
    });
  };

  const handleCancelPending = async () => {
    const { error: actionError } = await cancelPendingRequest();

    if (actionError) {
      showToast({
        type: "error",
        title: "Iptal basarisiz",
        description: actionError.message,
      });
      return;
    }

    showToast({
      type: "info",
      title: "Basvuru iptal edildi",
    });
  };

  const handleApprove = async (requestId: string) => {
    const { error: actionError } = await approveRequest(requestId);

    if (actionError) {
      showToast({
        type: "error",
        title: "Onay islemi basarisiz",
        description: actionError.message,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Basvuru onaylandi",
    });
  };

  const handleReject = async (requestId: string) => {
    const { error: actionError } = await rejectRequest(requestId);

    if (actionError) {
      showToast({
        type: "error",
        title: "Reddetme basarisiz",
        description: actionError.message,
      });
      return;
    }

    showToast({
      type: "info",
      title: "Basvuru reddedildi",
    });
  };

  return (
    <Screen>
      <View className="gap-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl border border-brand-tertiary bg-brand-surface self-start"
        >
          <FontAwesome6 name="arrow-left" size={16} color="#cbd5e1" />
        </Pressable>

        {isLoading ? (
          <View className="mt-10 items-center justify-center gap-4 rounded-3xl border border-brand-tertiary bg-brand-surface px-6 py-10">
            <ActivityIndicator size="large" color={colorPalette.primary} />
            <Text className="font-body text-sm text-brand-neutral">
              Etkinlik detayi yukleniyor...
            </Text>
          </View>
        ) : error ? (
          <View className="mt-10 gap-4 rounded-3xl border border-red-500/30 bg-red-950/30 px-5 py-5">
            <Text className="font-body text-sm text-red-400">{error}</Text>
            <Pressable
              onPress={() => void refetch()}
              className="self-start rounded-xl bg-brand-primary px-4 py-2"
            >
              <Text className="font-display text-sm text-brand-secondary">
                Tekrar dene
              </Text>
            </Pressable>
          </View>
        ) : event ? (
          <>
            <View className="gap-3">
              <View className="rounded-2xl border border-brand-tertiary bg-brand-raised overflow-hidden">
                <View className="flex-row items-start gap-3 p-4 md:p-5">
                  <View className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-brand-primary/40 bg-gradient-to-br from-brand-primary/15 to-brand-primary/5">
                    <DynamicIcon
                      name={event?.sports?.icon_name || "HelpCircle"}
                      size={28}
                      color={colorPalette.primary}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="font-display text-2xl md:text-3xl text-white leading-tight">
                      {event.title}
                    </Text>
                    <View className="mt-2 flex-row items-center gap-2 flex-wrap">
                      <View className="rounded-lg border border-brand-secondary/30 bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/10 px-3 py-1.5">
                        <Text className="font-mono text-[12px] md:text-[13px] text-brand-secondary font-semibold">
                          {event.sports?.name ?? event.sport_type}
                        </Text>
                      </View>
                    </View>

                    {!!event.description && (
                      <Text className="mt-3 font-body text-[13px] md:text-sm leading-6 text-brand-neutral">
                        {event.description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <Text className="font-display text-lg text-white">
                Etkinlik Bilgileri
              </Text>

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 px-4 py-4">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6
                      name="calendar"
                      size={16}
                      color={colorPalette.primary}
                    />
                    <Text className="font-mono text-[11px] text-brand-neutral">
                      Tarih
                    </Text>
                  </View>
                  <Text className="mt-2 font-display text-[15px] text-white leading-tight">
                    {
                      formatEventDate(
                        event.eventDate ?? event.event_date ?? "",
                      ).split(",")[0]
                    }
                  </Text>
                  <Text className="font-body text-[12px] text-brand-neutral">
                    {
                      formatEventDate(
                        event.eventDate ?? event.event_date ?? "",
                      ).split(",")[1]
                    }
                  </Text>
                </View>

                <View className="flex-1 rounded-2xl border border-brand-secondary/30 bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/5 px-4 py-4">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6 name="clock" size={16} color="#d6ddbe" />
                    <Text className="font-mono text-[11px] text-brand-neutral">
                      Saat
                    </Text>
                  </View>
                  <Text className="mt-2 font-display text-[15px] text-white">
                    {formatEventDate(event.eventDate ?? event.event_date ?? "")
                      .split(" ")
                      .slice(-2)
                      .join(" ")}
                  </Text>
                </View>
              </View>

              <View className="rounded-2xl border border-brand-tertiary bg-brand-raised px-4 py-4">
                <View className="flex-row items-start gap-3">
                  <FontAwesome6
                    name="map-pin"
                    size={18}
                    color={colorPalette.primary}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text className="font-mono text-[11px] text-brand-neutral">
                      Konum
                    </Text>
                    <Text className="mt-1.5 font-body text-[13px] leading-6 text-white">
                      {event.address_text}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="rounded-2xl border border-brand-tertiary bg-brand-raised px-4 py-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6
                      name="users"
                      size={16}
                      color={colorPalette.primary}
                    />
                    <Text className="font-mono text-[11px] text-brand-neutral">
                      Doluluk
                    </Text>
                  </View>
                  <Text className="font-display text-[14px] font-bold text-brand-primary">
                    {approvedCount}/{maxPlayers || 0}
                  </Text>
                </View>
                <View className="w-full overflow-hidden rounded-full bg-brand-surface h-3 border border-brand-tertiary/30">
                  <View
                    style={{
                      width: `${maxPlayers ? Math.min((approvedCount / maxPlayers) * 100, 100) : 0}%`,
                      height: "100%",
                      backgroundColor: colorPalette.primary,
                      borderRadius: 999,
                    }}
                  />
                </View>
                <Text className="mt-2.5 font-body text-[11px] text-brand-neutral">
                  {Math.max((maxPlayers || 0) - approvedCount, 0)} kontenjan
                  kaldi
                </Text>
              </View>

              {hasEventLocation ? (
                <View className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6
                      name="map-pin"
                      size={16}
                      color={colorPalette.primary}
                    />
                    <Text className="font-mono text-[11px] text-brand-neutral">
                      Harita
                    </Text>
                  </View>
                  <View className="overflow-hidden rounded-2xl border border-brand-tertiary">
                    {Platform.OS === "web" ? (
                      <View className="h-48 items-center justify-center bg-brand-raised px-4">
                        <Text className="font-body text-xs text-brand-neutral">
                          Web tarafinda harita goruntusu desteklenmiyor.
                        </Text>
                      </View>
                    ) : (
                      <MapView
                        style={{ height: 192, width: "100%" }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        initialRegion={{
                          latitude: event.latitude!,
                          longitude: event.longitude!,
                          latitudeDelta: 0.015,
                          longitudeDelta: 0.015,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: event.latitude!,
                            longitude: event.longitude!,
                          }}
                          title={event.title}
                          description={event.address_text}
                        />
                      </MapView>
                    )}
                  </View>
                </View>
              ) : null}
            </View>

            <View className="rounded-3xl border border-brand-tertiary bg-brand-surface px-5 py-5">
              <Text className="font-display text-lg text-white">
                Katilimcilar / Kadro
              </Text>

              <TacticalLineup
                sportType={event.sportType ?? event.sport_type ?? ""}
                maxPlayers={maxPlayers}
                approvedParticipants={approvedParticipants}
                eventOwnerId={event.createdBy ?? event.created_by ?? ""}
                isOrganizer={isOrganizer}
                currentUserStatus={currentUserStatus}
                isActionLoading={isActionLoading}
                onRequestToJoin={() => void handleRequestToJoin()}
              />
            </View>

            {isOrganizer ? (
              <Pressable
                onPress={() => setIsManageModalOpen(true)}
                disabled={isActionLoading}
                className={`min-h-[54px] flex-row items-center justify-center rounded-2xl border border-brand-primary bg-brand-primary ${
                  isActionLoading ? "opacity-70" : ""
                }`}
              >
                <Text className="font-display text-sm text-brand-secondary">
                  Istekleri Yonet
                </Text>
                {pendingRequestCount > 0 ? (
                  <View className="ml-2 rounded-full bg-brand-secondary px-2 py-0.5">
                    <Text className="font-mono text-[11px] text-brand-primary">
                      {pendingRequestCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ) : currentUserStatus === "approved" ? (
              <View className="gap-3">
                <View className="rounded-2xl border border-emerald-400/30 bg-emerald-950/60 px-4 py-3">
                  <Text className="font-body text-sm text-emerald-300">
                    Kadrodasin ✅
                  </Text>
                </View>

                <Pressable
                  onPress={() => void handleLeaveEvent()}
                  disabled={isActionLoading}
                  className={`min-h-[52px] items-center justify-center rounded-2xl border border-brand-tertiary bg-brand-surface ${
                    isActionLoading ? "opacity-70" : ""
                  }`}
                >
                  {isActionLoading ? (
                    <ActivityIndicator color="#ccff00" />
                  ) : (
                    <Text className="font-body text-sm text-brand-neutral">
                      Ayril
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : currentUserStatus === "pending" ? (
              <View className="gap-2">
                <View className="rounded-2xl border border-amber-300/30 bg-amber-900/30 px-4 py-3">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6 name="clock" size={16} color="#facc15" />
                    <Text className="font-body text-sm text-amber-200">
                      Istegin degerlendiriliyor
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => void handleCancelPending()}
                  disabled={isActionLoading}
                  className={`min-h-[48px] items-center justify-center rounded-2xl border border-brand-tertiary bg-brand-surface ${
                    isActionLoading ? "opacity-70" : ""
                  }`}
                >
                  {isActionLoading ? (
                    <ActivityIndicator color="#ccff00" />
                  ) : (
                    <Text className="font-body text-sm text-brand-neutral">
                      Basvuruyu Iptal Et
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => void handleRequestToJoin()}
                disabled={isActionLoading}
                className={`min-h-[54px] items-center justify-center rounded-2xl border border-brand-primary bg-brand-primary ${
                  isActionLoading ? "opacity-70" : ""
                }`}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="font-display text-sm text-brand-secondary">
                    {currentUserStatus === "rejected"
                      ? "Tekrar Katilma Istegi Gonder"
                      : "Maca Katil"}
                  </Text>
                )}
              </Pressable>
            )}
          </>
        ) : null}
      </View>

      <Modal
        visible={isManageModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsManageModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[72%] rounded-t-3xl border border-brand-tertiary bg-brand-surface px-5 pb-6 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-display text-lg text-white">
                Bekleyen Katilim Talepleri
              </Text>
              <Pressable
                onPress={() => setIsManageModalOpen(false)}
                className="h-9 w-9 items-center justify-center rounded-xl border border-brand-tertiary bg-brand-raised"
              >
                <FontAwesome6 name="x" size={16} color="#cbd5e1" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pendingParticipants.length === 0 ? (
                <View className="rounded-2xl border border-brand-tertiary bg-brand-raised px-4 py-4">
                  <Text className="font-body text-sm text-brand-neutral">
                    Su an bekleyen basvuru yok.
                  </Text>
                </View>
              ) : (
                <View className="gap-3 pb-3">
                  {pendingParticipants.map((participant) => {
                    const isRowLoading =
                      isActionLoading &&
                      activeRequestId === participant.requestId;

                    return (
                      <View
                        key={participant.requestId}
                        className="rounded-2xl border border-brand-tertiary bg-brand-raised px-3 py-3"
                      >
                        <View className="flex-row items-center gap-3">
                          {participant.avatarUrl ? (
                            <Image
                              source={{ uri: participant.avatarUrl }}
                              className="h-10 w-10 rounded-full border border-brand-tertiary"
                            />
                          ) : (
                            <View className="h-10 w-10 items-center justify-center rounded-full border border-brand-tertiary bg-brand-surface">
                              <Text className="font-mono text-[10px] text-brand-neutral">
                                {getInitials(participant.fullName)}
                              </Text>
                            </View>
                          )}

                          <View className="flex-1">
                            <Text className="font-body text-sm text-white">
                              {participant.fullName}
                            </Text>
                            <Text className="font-mono text-[11px] text-brand-neutral">
                              {getSkillLabel(participant.skillLevel)}
                            </Text>
                          </View>
                        </View>

                        <View className="mt-3 flex-row gap-2">
                          <Pressable
                            onPress={() =>
                              void handleApprove(participant.requestId)
                            }
                            disabled={isRowLoading}
                            className={`flex-1 min-h-[42px] items-center justify-center rounded-xl bg-brand-primary ${
                              isRowLoading ? "opacity-70" : ""
                            }`}
                          >
                            {isRowLoading ? (
                              <ActivityIndicator color="#0f172a" />
                            ) : (
                              <View className="flex-row items-center gap-1">
                                <FontAwesome6
                                  name="check"
                                  size={14}
                                  color="#0f172a"
                                />
                                <Text className="font-body text-sm text-brand-secondary">
                                  Onayla
                                </Text>
                              </View>
                            )}
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              void handleReject(participant.requestId)
                            }
                            disabled={isRowLoading}
                            className={`flex-1 min-h-[42px] items-center justify-center rounded-xl border border-brand-tertiary bg-brand-surface ${
                              isRowLoading ? "opacity-70" : ""
                            }`}
                          >
                            <Text className="font-body text-sm text-brand-neutral">
                              Reddet
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
