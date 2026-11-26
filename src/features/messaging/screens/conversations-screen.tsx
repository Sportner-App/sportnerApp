import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  AppScreen,
  AppText as Text,
  Avatar,
  brandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { useConversationsTabCopy } from "@/features/messaging/copy";
import { useSession, useToast } from "@/contexts";
import {
  useRefreshableLoad,
  type LoadMode,
} from "@/hooks/use-refreshable-load";
import {
  readConversationsCache,
  writeConversationsCache,
} from "@/features/messaging/conversations-cache";
import { HIT_SLOP, palette, themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  deleteConversation,
  listMyConversations,
} from "@/features/messaging/services/messaging-service";
import {
  CONVERSATION_TYPE,
  type ApiConversationListItem,
} from "@/features/messaging/types";
import { HubConnectionState } from "@microsoft/signalr";
import { connectInbox } from "@/features/messaging/services/chat-realtime";
import { formatConversationTime } from "@/features/messaging/messaging-time";

import { NewConversationSheet } from "@/features/messaging/components/new-conversation-sheet";
import { confirmDestructive } from "@/utils/confirm";

type InboxTab = "events" | "friends";

type InboxData = {
  /** Verinin sahibi; hesap değişirse başkasının sohbeti görünmesin. */
  userId: string | null;
  events: ApiConversationListItem[];
  friends: ApiConversationListItem[];
  /** En az bir başarılı yükleme ya da önbellekten başlama oldu mu. */
  loaded: boolean;
};

function createInboxData(userId: string | null): InboxData {
  const cached = readConversationsCache(userId);
  return cached
    ? { userId, events: cached.events, friends: cached.friends, loaded: true }
    : { userId, events: [], friends: [], loaded: false };
}

export function ConversationsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["messaging", "common"]);
  const TAB_COPY = useConversationsTabCopy();
  const { showToast } = useToast();
  const [tab, setTab] = useState<InboxTab>("friends");
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [data, setData] = useState<InboxData>(() => createInboxData(userId));
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Ekran açıkken kullanıcı değişirse eski kullanıcının listesi kalmasın.
  if (data.userId !== userId) {
    setData(createInboxData(userId));
  }
  const view = data.userId === userId ? data : createInboxData(userId);
  const eventItems = view.events;
  const friendItems = view.friends;

  const dataRef = useRef(view);
  dataRef.current = view;

  const load = useCallback(
    async (mode: LoadMode) => {
      const requestId = ++requestIdRef.current;
      if (!userId) return;
      if (mode === "initial") setError(null);
      try {
        const [events, friends] = await Promise.all([
          listMyConversations({ type: CONVERSATION_TYPE.event }),
          listMyConversations({ type: CONVERSATION_TYPE.direct }),
        ]);
        if (requestId !== requestIdRef.current) return;
        setError(null);
        setData({
          userId,
          events: events.items,
          // Backend de boş birebir sohbetleri filtreliyor. Bu savunmacı filtre,
          // eski API sürümüyle çalışan istemcilerde de mesaj atılmadan açılıp
          // kapatılan sohbetlerin listede görünmesini engeller.
          friends: friends.items.filter((item) => item.lastMessageAt != null),
          loaded: true,
        });
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return;
        const current = dataRef.current;
        const hasData = current.events.length > 0 || current.friends.length > 0;
        const message = getApiErrorMessage(loadError, t("messaging:loadFailed"));
        if (mode === "refresh" && hasData) {
          showToast({
            type: "error",
            title: t("messaging:loadFailed"),
            description: message,
          });
        } else if (!hasData && (mode !== "silent" || !current.loaded)) {
          setError(message);
        }
      }
    },
    [showToast, t, userId],
  );

  const { isRefreshing, refresh, reload } = useRefreshableLoad(load, {
    trigger: "focus",
    refocusMode: "silent",
    enabled: Boolean(userId),
    resetKey: userId,
  });

  // Canlı güncelleme: ekran odaktayken sohbet hub'ına bağlanır; olay gelince
  // liste sessizce yeniden çekilir (önizleme olayda gelmez).
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      let inFlight = false;
      let dirty = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let connection: Awaited<ReturnType<typeof connectInbox>> = null;

      const refreshSilently = async () => {
        if (!active) return;
        if (inFlight) {
          dirty = true;
          return;
        }
        inFlight = true;
        try {
          await reloadRef.current("silent");
        } finally {
          inFlight = false;
        }
        if (active && dirty) {
          dirty = false;
          void refreshSilently();
        }
      };

      // Aralıksız mesaj akan sohbette de liste yenilensin diye zamanlayıcı
      // sıfırlanmaz; rastgele ek, büyük etkinlik sohbetinde tüm üyelerin aynı
      // anda istek atmasını önler.
      const scheduleRefresh = () => {
        if (!active || timer) return;
        timer = setTimeout(
          () => {
            timer = null;
            void refreshSilently();
          },
          400 + Math.random() * 800,
        );
      };

      // Otomatik yeniden bağlanma birkaç denemeden sonra bırakıyor (arka plan,
      // süresi dolan anahtar); ekran açık kaldıkça bağlantı yeniden kurulur.
      let connecting = false;
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleReconnect = (delayMs: number) => {
        if (!active || retryTimer) return;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          ensureConnected();
        }, delayMs);
      };
      const ensureConnected = () => {
        if (!active || connecting) return;
        if (
          connection &&
          connection.state !== HubConnectionState.Disconnected
        ) {
          return;
        }
        connecting = true;
        connectInbox(scheduleRefresh, scheduleRefresh)
          .then((created) => {
            if (!created) return;
            if (!active) {
              void created.stop();
              return;
            }
            connection = created;
            created.onclose(() => scheduleReconnect(5000));
            // Bağlantı kurulurken gelen mesaj kaçmasın.
            scheduleRefresh();
          })
          .catch((connectError) => {
            console.warn("Inbox realtime connection failed", connectError);
            scheduleReconnect(10000);
          })
          .finally(() => {
            connecting = false;
          });
      };
      ensureConnected();

      const appStateSubscription = AppState.addEventListener(
        "change",
        (state) => {
          if (state !== "active") return;
          scheduleRefresh();
          ensureConnected();
        },
      );

      return () => {
        active = false;
        if (timer) clearTimeout(timer);
        if (retryTimer) clearTimeout(retryTimer);
        timer = null;
        retryTimer = null;
        appStateSubscription.remove();
        void connection?.stop();
      };
    }, [userId]),
  );

  // Önbellek: yalnızca başarılı yükleme/önbellekten başlama sonrası yazılır.
  useEffect(() => {
    if (userId && data.userId === userId && data.loaded) {
      writeConversationsCache(userId, data.events, data.friends);
    }
  }, [data, userId]);

  const markConversationReadLocally = useCallback((id: string) => {
    const clear = (list: ApiConversationListItem[]) =>
      list.some((item) => item.id === id && item.unreadCount > 0)
        ? list.map((item) =>
            item.id === id ? { ...item, unreadCount: 0 } : item,
          )
        : list;
    setData((current) => {
      const events = clear(current.events);
      const friends = clear(current.friends);
      return events === current.events && friends === current.friends
        ? current
        : { ...current, events, friends };
    });
  }, []);

  const confirmDelete = useCallback(
    (item: ApiConversationListItem) => {
      confirmDestructive({
        title: t("messaging:delete.title"),
        message: t("messaging:delete.description"),
        confirmLabel: t("messaging:delete.confirm"),
        cancelLabel: t("messaging:delete.cancel"),
        onConfirm: () => {
          setDeletingId(item.id);
          void deleteConversation(item.id)
            .then(() => {
              // Uçuştaki tazeleme silinen satırı geri getirmesin.
              requestIdRef.current++;
              setData((current) => ({
                ...current,
                events: current.events.filter(
                  (candidate) => candidate.id !== item.id,
                ),
                friends: current.friends.filter(
                  (candidate) => candidate.id !== item.id,
                ),
              }));
              showToast({
                type: "success",
                title: t("messaging:delete.success"),
              });
            })
            .catch((deleteError) => {
              showToast({
                type: "error",
                title: t("messaging:delete.failed"),
                description: getApiErrorMessage(deleteError),
              });
            })
            .finally(() => setDeletingId(null));
        },
      });
    },
    [showToast, t],
  );

  const hasData = eventItems.length > 0 || friendItems.length > 0;
  // Oturum ekran açıkken düşerse yükleme çalışmaz; gösterge takılı kalmasın.
  const showLoader = Boolean(userId) && !view.loaded && !error;
  const items = tab === "events" ? eventItems : friendItems;
  const copy = TAB_COPY[tab];
  const friendUnreadCount = useMemo(
    () => friendItems.reduce((total, item) => total + item.unreadCount, 0),
    [friendItems],
  );
  const eventUnreadCount = useMemo(
    () => eventItems.reduce((total, item) => total + item.unreadCount, 0),
    [eventItems],
  );

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
                hitSlop={HIT_SLOP}
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
        onRefresh: () => void refresh(),
      })}
    >
      <View className="gap-1 pb-2">
        <Text className="font-display text-heading-lg text-text-primary">
          {t("messaging:screen.title")}
        </Text>
        <Text className="font-body text-body-sm leading-5 text-text-tertiary">
          {copy.subtitle}
        </Text>
      </View>

      <SegmentedTabs
        options={[
          {
            key: "friends",
            label: t("messaging:tabs.friends"),
            badge: friendUnreadCount > 0 ? friendUnreadCount : undefined,
          },
          {
            key: "events",
            label: t("messaging:tabs.events"),
            badge: eventUnreadCount > 0 ? eventUnreadCount : undefined,
          },
        ]}
        value={tab}
        onChange={setTab}
      />

      {showLoader ? (
        <ScreenLoader
          label={t("messaging:loading")}
          className="items-center py-3xl"
          size={132}
        />
      ) : error && !hasData ? (
        <View className="items-center gap-4 rounded-[28px] border border-border-default bg-surface-primary px-6 py-10">
          <FontAwesome6
            name="triangle-exclamation"
            size={24}
            color={themeColors.destructive}
          />
          <Text className="text-center font-body text-body-sm text-text-secondary">
            {error}
          </Text>
          <Pressable
            onPress={() => void reload("initial")}
            className="rounded-full bg-brand-primary px-5 py-3 active:opacity-75"
          >
            <Text className="font-body-bold text-body-sm text-text-on-primary">
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
          <Text className="font-body-bold text-body text-text-primary">
            {copy.emptyTitle}
          </Text>
          <Text className="text-center font-body text-body-sm leading-5 text-text-tertiary">
            {copy.emptyBody}
          </Text>
          {tab === "friends" ? (
            <Pressable
              onPress={() => setComposeOpen(true)}
              className="mt-1 rounded-full bg-brand-primary px-5 py-3 active:opacity-75"
            >
              <Text className="font-body-bold text-body-sm text-text-on-primary">
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
            onPress={() => {
              markConversationReadLocally(item.id);
              router.push(`/conversations/${item.id}`);
            }}
            onDelete={() => confirmDelete(item)}
            deleting={deletingId === item.id}
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

const DELETE_ACTION_WIDTH = 88;

function ConversationRow({
  item,
  onPress,
  onDelete,
  deleting,
}: {
  item: ApiConversationListItem;
  onPress: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { t } = useTranslation("messaging");
  const isEvent = item.type === CONVERSATION_TYPE.event;
  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const title = isEvent
    ? item.title || t("messaging:row.eventFallback")
    : item.peerFirstName ||
      item.peerUsername ||
      item.title ||
      t("messaging:row.chatFallback");

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .onStart(() => {
          dragStartX.value = translateX.value;
        })
        .onUpdate((event) => {
          translateX.value = Math.max(
            -DELETE_ACTION_WIDTH,
            Math.min(0, dragStartX.value + event.translationX),
          );
        })
        .onEnd((event) => {
          const shouldOpen =
            translateX.value < -DELETE_ACTION_WIDTH / 2 ||
            event.velocityX < -500;
          translateX.value = withSpring(shouldOpen ? -DELETE_ACTION_WIDTH : 0, {
            dampingRatio: 0.82,
            duration: 260,
          });
        }),
    [dragStartX, translateX],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="relative overflow-hidden rounded-[24px]">
      <View className="absolute inset-y-0 right-0 w-[88px] items-center justify-center bg-destructive">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("messaging:delete.a11y", { title })}
          accessibilityState={{ disabled: deleting }}
          disabled={deleting}
          onPress={onDelete}
          className="h-full w-full items-center justify-center gap-1 active:opacity-70"
        >
          <FontAwesome6 name="trash-can" size={18} color={palette.white} />
          <Text className="font-body-bold text-overline text-white">
            {deleting
              ? t("messaging:delete.deleting")
              : t("messaging:delete.action")}
          </Text>
        </Pressable>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("messaging:row.openA11y", { title })}
            onPress={onPress}
            // Dokunma geri bildirimi saydamlıkla değil renkle: satırın
            // arkasında kırmızı sil katmanı duruyor ve opaklık düşünce o
            // katman satırın içinden görünüyordu.
            className="flex-row items-center gap-3 rounded-[24px] border border-border-default bg-surface-primary px-4 py-4 active:bg-surface-secondary"
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
                  className="min-w-0 flex-1 font-body-bold text-body text-text-primary"
                >
                  {title}
                </Text>
                {isEvent && item.isClosed ? (
                  <View className="rounded-full bg-white/10 px-2 py-0.5">
                    <Text className="font-body-bold text-overline uppercase tracking-wide text-text-tertiary">
                      {t("messaging:row.closed")}
                    </Text>
                  </View>
                ) : null}
                {item.lastMessageAt ? (
                  <Text className="font-body-bold text-overline text-text-tertiary">
                    {formatConversationTime(item.lastMessageAt)}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row items-center gap-2">
                <Text
                  numberOfLines={1}
                  className={`min-w-0 flex-1 font-body text-label ${
                    item.unreadCount > 0
                      ? "text-text-primary"
                      : "text-text-tertiary"
                  }`}
                >
                  {item.lastMessagePreview || t("messaging:row.noMessages")}
                </Text>
                {item.unreadCount > 0 ? (
                  <View className="min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 py-0.5">
                    <Text className="font-body-bold text-overline text-text-on-primary">
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
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
