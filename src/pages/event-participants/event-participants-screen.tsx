import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  BrandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getEventParticipants } from "@/services/events-service";
import type { EventParticipant } from "@/types/events";
import { isCurrentParticipant } from "@/utils/events";
import { lightImpact } from "@/utils/haptics";

export function EventParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!id) return;

      mode === "initial" ? setIsLoading(true) : setIsRefreshing(true);
      try {
        setError(null);
        const items = await getEventParticipants(id);
        setParticipants(
          items.filter((item) => isCurrentParticipant(item.status)),
        );
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
              onPress={
                item.userId && !item.isGuest
                  ? () => router.push(`/users/${item.userId}`)
                  : undefined
              }
            />
          )}
        />
      )}
    </AppScreen>
  );
}

function ParticipantRow({
  participant,
  onPress,
}: {
  participant: EventParticipant;
  onPress?: () => void;
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
