import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  BottomSheet,
  BrandRefreshControl,
  Button,
  Input,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getEventById,
  removeEventParticipant,
} from "@/services/events-service";
import { listReportReasons } from "@/services/reports-service";
import type { EventDetail, EventParticipant } from "@/types/events";
import type { ApiReportReason } from "@/types/social";
import { isCurrentParticipant } from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

export function EventParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [reasons, setReasons] = useState<ApiReportReason[]>([]);
  const [removalTarget, setRemovalTarget] = useState<EventParticipant | null>(
    null,
  );
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!id) return;

      mode === "initial" ? setIsLoading(true) : setIsRefreshing(true);
      try {
        setError(null);
        const detail = await getEventById(id);
        const items = detail?.participants ?? [];
        setParticipants(
          items.filter((item) => isCurrentParticipant(item.status)),
        );
        setEvent(detail);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Katılımcılar yüklenemedi."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const isOrganizer = Boolean(user?.id && event?.organizerUserId === user.id);

  useEffect(() => {
    if (!isOrganizer || reasons.length > 0) return;
    void listReportReasons()
      .then(setReasons)
      .catch(() => setReasons([]));
  }, [isOrganizer, reasons.length]);

  const closeRemoval = () => {
    if (isRemoving) return;
    setRemovalTarget(null);
    setReasonId(null);
    setNote("");
  };

  const confirmRemoval = async () => {
    if (!id || !removalTarget || !reasonId || isRemoving) return;
    setIsRemoving(true);
    const result = await removeEventParticipant(id, removalTarget.id, {
      reportReasonId: reasonId,
      note: note.trim() || undefined,
    });
    setIsRemoving(false);

    if (result.error) {
      showToast({
        type: "error",
        title: "Katılımcı çıkarılamadı",
        description: result.error.message,
      });
      return;
    }

    setParticipants((current) =>
      current.filter((participant) => participant.id !== removalTarget.id),
    );
    showToast({
      type: "success",
      title: "Katılımcı çıkarıldı",
      description: "Seçilen sebep analiz için kaydedildi.",
    });
    closeRemoval();
  };

  return (
    <AppScreen
      tone="light"
      scroll={false}
      header={<ScreenHeader title="KATILIMCILAR" showBack tone="light" />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="flex-1"
    >
      {isLoading ? (
        <View className="flex-1 items-center justify-center pb-16">
          <SportLoader size={128} label="Katılımcılar yükleniyor" />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-5 pb-10 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <BrandRefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load("refresh")}
            />
          }
          ListHeaderComponent={
            participants.length > 0 ? (
              <Text className="pb-1 font-body text-xs text-text-secondary">
                {participants.length} katılımcı
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center gap-3 px-6 py-20">
              <FontAwesome6
                name={error ? "circle-exclamation" : "user-group"}
                size={24}
                color={themeColors.text.secondary}
              />
              <Text className="text-center font-body text-sm text-text-secondary">
                {error ?? "Henüz katılımcı yok."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ParticipantRow
              participant={item}
              canRemove={isOrganizer && item.userId !== event?.organizerUserId}
              onRemove={() => {
                setRemovalTarget(item);
                setReasonId(null);
                setNote("");
              }}
              onPress={
                item.userId && !item.isGuest
                  ? () => router.push(`/users/${item.userId}`)
                  : undefined
              }
            />
          )}
        />
      )}

      <BottomSheet
        visible={removalTarget != null}
        onClose={closeRemoval}
        title="Katılımcıyı çıkar"
        subtitle={
          removalTarget
            ? `${removalTarget.name} için çıkarma sebebini seç.`
            : undefined
        }
        tone="light"
        showCancel={false}
      >
        <View className="gap-3">
          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerClassName="gap-2"
            showsVerticalScrollIndicator={false}
          >
            {reasons.map((reason) => (
              <Pressable
                key={reason.id}
                onPress={() => setReasonId(reason.id)}
                className={`rounded-2xl border px-4 py-3 ${
                  reasonId === reason.id
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-border-default bg-surface-primary"
                }`}
              >
                <Text className="font-body-bold text-sm text-text-primary">
                  {reason.name}
                </Text>
                {reason.description ? (
                  <Text className="mt-1 font-body text-xs text-text-secondary">
                    {reason.description}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
          <Input
            label="Açıklama (opsiyonel)"
            placeholder="Eklemek istediğin ayrıntılar"
            value={note}
            onChangeText={setNote}
            maxLength={1000}
            multiline
          />
          <View className="mt-2 flex-row gap-3">
            <View className="flex-1">
              <Button
                label="Vazgeç"
                variant="secondary"
                disabled={isRemoving}
                onPress={closeRemoval}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Çıkar"
                variant="danger"
                disabled={!reasonId || isRemoving}
                isLoading={isRemoving}
                onPress={confirmRemoval}
              />
            </View>
          </View>
        </View>
      </BottomSheet>
    </AppScreen>
  );
}

function ParticipantRow({
  participant,
  onPress,
  canRemove,
  onRemove,
}: {
  participant: EventParticipant;
  onPress?: () => void;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  const content = (
    <>
      <Avatar
        uri={participant.avatarUrl}
        name={participant.name}
        isGuest={participant.isGuest}
        size={48}
        borderWidth={0}
      />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-body-bold text-sm text-text-primary"
        >
          {participant.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-body text-xs text-text-secondary"
        >
          {participant.isGuest
            ? "Misafir katılımcı"
            : participant.username
              ? `@${participant.username}`
              : "Sporcu"}
        </Text>
      </View>
      {onPress ? (
        <FontAwesome6
          name="chevron-right"
          size={11}
          color={themeColors.text.tertiary}
        />
      ) : null}
      {canRemove ? (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${participant.name} adlı katılımcıyı çıkar`}
          onPress={() => {
            lightImpact();
            onRemove?.();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-status-error/10 active:opacity-70"
        >
          <FontAwesome6
            name="user-minus"
            size={13}
            color={themeColors.destructive}
          />
        </Pressable>
      ) : null}
    </>
  );

  const className =
    "flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3";

  return onPress ? (
    <Pressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      className={`${className} active:opacity-70`}
    >
      {content}
    </Pressable>
  ) : (
    <View className={className}>{content}</View>
  );
}
