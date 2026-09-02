import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  BrandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyConversations } from "@/services/messaging-service";
import {
  CONVERSATION_TYPE,
  type ApiConversationListItem,
} from "@/types/messaging";

import { NewConversationSheet } from "./new-conversation-sheet";

type InboxTab = "events" | "friends";

const TAB_COPY: Record<
  InboxTab,
  {
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    icon: "calendar-days" | "user-group";
  }
> = {
  events: {
    subtitle: "Katıldığın etkinliklerin grup sohbetleri.",
    emptyTitle: "Henüz etkinlik sohbetin yok",
    emptyBody: "Bir etkinliğe katıldığında sohbet burada görünecek.",
    icon: "calendar-days",
  },
  friends: {
    subtitle: "Arkadaşlarınla birebir yazışmaların.",
    emptyTitle: "Henüz arkadaş sohbetin yok",
    emptyBody:
      "Bir arkadaşının profilinden Mesaj gönder diyerek sohbet başlatabilirsin.",
    icon: "user-group",
  },
};

export function ConversationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<InboxTab>("events");
  const [eventItems, setEventItems] = useState<ApiConversationListItem[]>([]);
  const [friendItems, setFriendItems] = useState<ApiConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setError(null);
      const [events, friends] = await Promise.all([
        listMyConversations({ type: CONVERSATION_TYPE.event }),
        listMyConversations({ type: CONVERSATION_TYPE.direct }),
      ]);
      setEventItems(events.items);
      setFriendItems(friends.items);
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

  const items = tab === "events" ? eventItems : friendItems;
  const copy = TAB_COPY[tab];

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="SOHBETLERİM"
          showBack
          right={
            tab === "friends" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Yeni sohbet başlat"
                hitSlop={8}
                onPress={() => setComposeOpen(true)}
                className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-surface-primary active:opacity-70"
              >
                <FontAwesome6
                  name="pen-to-square"
                  size={14}
                  color={themeColors.brand.primary}
                />
              </Pressable>
            ) : undefined
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-3 px-5 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void load(true)}
        />
      }
    >
      <View className="gap-1 pb-2">
        <Text className="font-display text-[28px] text-text-primary">
          Mesajların
        </Text>
        <Text className="font-body text-sm leading-5 text-text-tertiary">
          {copy.subtitle}
        </Text>
      </View>

      <SegmentedTabs
        options={[
          { key: "events", label: "Etkinlik" },
          { key: "friends", label: "Arkadaşlar" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <View className="items-center py-3xl">
          <SportLoader size={132} label="Sohbetler yükleniyor" />
        </View>
      ) : error ? (
        <View className="items-center gap-4 rounded-[28px] border border-border-default bg-surface-primary px-6 py-10">
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
        <View className="items-center gap-3 rounded-[28px] border border-border-default bg-surface-primary px-6 py-12">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
            <FontAwesome6
              name={copy.icon}
              size={22}
              color={themeColors.brand.primary}
            />
          </View>
          <Text className="font-body-bold text-base text-text-primary">
            {copy.emptyTitle}
          </Text>
          <Text className="text-center font-body text-sm leading-5 text-text-tertiary">
            {copy.emptyBody}
          </Text>
          {tab === "friends" ? (
            <Pressable
              onPress={() => setComposeOpen(true)}
              className="mt-1 rounded-full bg-brand-primary px-5 py-3 active:opacity-75"
            >
              <Text className="font-body-bold text-sm text-text-on-primary">
                Yeni sohbet başlat
              </Text>
            </Pressable>
          ) : null}
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

      <NewConversationSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
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
  const isEvent = item.type === CONVERSATION_TYPE.event;
  const title = isEvent
    ? item.title || "Etkinlik sohbeti"
    : item.peerFirstName || item.peerUsername || item.title || "Sohbet";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} sohbetini aç`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[24px] border border-border-default bg-surface-primary px-4 py-4 active:opacity-75"
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
          {isEvent && item.isClosed ? (
            <View className="rounded-full bg-white/10 px-2 py-0.5">
              <Text className="font-mono text-[9px] uppercase tracking-wide text-text-tertiary">
                Kapandı
              </Text>
            </View>
          ) : null}
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
              item.unreadCount > 0 ? "text-text-primary" : "text-text-tertiary"
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
