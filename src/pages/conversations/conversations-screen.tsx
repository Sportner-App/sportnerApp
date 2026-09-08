import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  brandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { useConversationsTabCopy } from "@/constants/messaging";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listMyConversations } from "@/services/messaging-service";
import {
  CONVERSATION_TYPE,
  type ApiConversationListItem,
} from "@/types/messaging";
import { formatConversationTime } from "@/utils/messaging-time";

import { NewConversationSheet } from "./new-conversation-sheet";

type InboxTab = "events" | "friends";

export function ConversationsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["messaging", "common"]);
  const TAB_COPY = useConversationsTabCopy();
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
      setError(getApiErrorMessage(loadError, t("messaging:loadFailed")));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

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
          title={t("messaging:header.title")}
          showBack
          right={
            tab === "friends" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("messaging:newChatA11y")}
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
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: () => void load(true),
      })}
    >
      <View className="gap-1 pb-2">
        <Text className="font-display text-[28px] text-text-primary">
          {t("messaging:screen.title")}
        </Text>
        <Text className="font-body text-sm leading-5 text-text-tertiary">
          {copy.subtitle}
        </Text>
      </View>

      <SegmentedTabs
        options={[
          { key: "events", label: t("messaging:tabs.events") },
          { key: "friends", label: t("messaging:tabs.friends") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <View className="items-center py-3xl">
          <SportLoader size={132} label={t("messaging:loading")} />
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
              {t("common:retry")}
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
                {t("messaging:newChat")}
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
  const { t } = useTranslation("messaging");
  const isEvent = item.type === CONVERSATION_TYPE.event;
  const title = isEvent
    ? item.title || t("messaging:row.eventFallback")
    : item.peerFirstName ||
      item.peerUsername ||
      item.title ||
      t("messaging:row.chatFallback");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("messaging:row.openA11y", { title })}
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
                {t("messaging:row.closed")}
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
            {item.lastMessagePreview || t("messaging:row.noMessages")}
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
