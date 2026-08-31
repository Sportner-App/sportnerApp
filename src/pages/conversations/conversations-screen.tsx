import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  BrandRefreshControl,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyConversations } from "@/services/messaging-service";
import type { ApiConversationListItem } from "@/types/messaging";

export function ConversationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ApiConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setError(null);
      const page = await listMyConversations();
      setItems(page.items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Sohbetler yüklenemedi."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <AppScreen
      header={<ScreenHeader title="SOHBETLERİM" showBack />}
      contentClassName="gap-3 px-5 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void load(true)}
        />
      }
    >
      <View className="gap-1 pb-2">
        <Text className="font-display text-[28px] text-text-inverse">
          Mesajların
        </Text>
        <Text className="font-body text-sm leading-5 text-text-tertiary">
          Katıldığın etkinliklerin sohbetlerine buradan hızlıca ulaşabilirsin.
        </Text>
      </View>

      {isLoading ? (
        <View className="items-center py-3xl">
          <SportLoader size={132} label="Sohbetler yükleniyor" />
        </View>
      ) : error ? (
        <View className="items-center gap-4 rounded-[28px] border border-white/10 bg-surface-primary px-6 py-10">
          <FontAwesome6
            name="triangle-exclamation"
            size={24}
            color={themeColors.destructive}
          />
          <Text className="text-center font-body text-sm text-text-secondary">
            {error}
          </Text>
          <Pressable
            onPress={() => void load()}
            className="rounded-full bg-brand-primary px-5 py-3 active:opacity-75"
          >
            <Text className="font-body-bold text-sm text-text-on-primary">
              Tekrar dene
            </Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View className="items-center gap-3 rounded-[28px] border border-white/10 bg-surface-primary px-6 py-12">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
            <FontAwesome6
              name="comments"
              size={22}
              color={themeColors.brand.primary}
            />
          </View>
          <Text className="font-body-bold text-base text-text-primary">
            Henüz sohbetin yok
          </Text>
          <Text className="text-center font-body text-sm leading-5 text-text-tertiary">
            Bir etkinliğe katıldığında etkinlik sohbeti burada görünecek.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <ConversationRow
            key={item.id}
            item={item}
            onPress={() => router.push(`/conversations/${item.id}`)}
          />
        ))
      )}
    </AppScreen>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ApiConversationListItem;
  onPress: () => void;
}) {
  const isEvent = item.type === 0;
  const title = isEvent
    ? item.title || "Etkinlik sohbeti"
    : item.peerFirstName || item.peerUsername || item.title || "Sohbet";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} sohbetini aç`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[24px] border border-white/10 bg-surface-primary px-4 py-4 active:opacity-75"
    >
      {isEvent ? (
        <View className="h-12 w-12 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/10">
          <FontAwesome6
            name="calendar-days"
            size={18}
            color={themeColors.brand.primary}
          />
        </View>
      ) : (
        <Avatar
          uri={item.peerProfileImageUrl}
          name={title}
          size={48}
          previewable={false}
        />
      )}

      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-body-bold text-[15px] text-text-primary"
          >
            {title}
          </Text>
          {item.lastMessageAt ? (
            <Text className="font-mono text-[10px] text-text-tertiary">
              {formatConversationTime(item.lastMessageAt)}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={`min-w-0 flex-1 font-body text-[13px] ${
              item.unreadCount > 0
                ? "text-text-primary"
                : "text-text-tertiary"
            }`}
          >
            {item.lastMessagePreview || "Henüz mesaj yok"}
          </Text>
          {item.unreadCount > 0 ? (
            <View className="min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 py-0.5">
              <Text className="font-mono text-[10px] text-text-on-primary">
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <FontAwesome6
        name="chevron-right"
        size={11}
        color={themeColors.text.tertiary}
      />
    </Pressable>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("tr-TR", {
    ...(sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short" }),
  }).format(date);
}
