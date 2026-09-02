import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications-service";
import type { ApiNotification } from "@/types/notifications";
import {
  NOTIFICATION_ENTITY,
  NOTIFICATION_TYPE,
  notificationCopy,
} from "@/types/notifications";

export function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more") => {
      if (mode === "initial") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
      if (mode === "more") setIsLoadingMore(true);

      try {
        const page = await listNotifications({
          before: mode === "more" ? (cursor ?? undefined) : undefined,
        });
        setItems((prev) =>
          mode === "more" ? [...prev, ...page.items] : page.items,
        );
        setCursor(page.nextCursor);
      } catch (error) {
        showToast({
          type: "error",
          title: "Yüklenemedi",
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [cursor, showToast],
  );

  useEffect(() => {
    void load("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!cursor || isLoading || isRefreshing || isLoadingMore) {
      return;
    }
    void load("more");
  }, [cursor, isLoading, isLoadingMore, isRefreshing, load]);

  const open = async (item: ApiNotification) => {
    if (!item.isRead) {
      await markNotificationRead(item.id).catch(() => undefined);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isRead: true } : row,
        ),
      );
    }

    const friendUserId = item.actorUserId || item.entityId;
    if (
      (item.notificationType === NOTIFICATION_TYPE.friendRequest ||
        item.notificationType === NOTIFICATION_TYPE.friendAccepted) &&
      friendUserId
    ) {
      router.push(`/users/${friendUserId}`);
      return;
    }

    if (!item.entityId) {
      return;
    }

    if (item.entityType === NOTIFICATION_ENTITY.event) {
      router.push(`/events/${item.entityId}`);
    } else if (item.entityType === NOTIFICATION_ENTITY.user) {
      router.push(`/users/${item.entityId}`);
    } else if (item.entityType === NOTIFICATION_ENTITY.post) {
      router.push(`/posts/${item.entityId}`);
    } else if (item.entityType === NOTIFICATION_ENTITY.conversation) {
      router.push(`/conversations/${item.entityId}`);
    } else if (item.entityType === NOTIFICATION_ENTITY.badge) {
      router.push("/badges");
    } else if (item.entityType === NOTIFICATION_ENTITY.organization) {
      router.push(`/organizations/${item.entityId}`);
    }
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="BİLDİRİMLER"
          showBack
          right={
            <Pressable
              onPress={async () => {
                await markAllNotificationsRead().catch(() => undefined);
                setItems((prev) =>
                  prev.map((item) => ({ ...item, isRead: true })),
                );
              }}
              className="px-2"
            >
              <Text className="font-body text-xs text-brand-primary">
                Tümünü oku
              </Text>
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-3 px-6 pt-2"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
      onEndReached={loadMore}
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Bildirimler yükleniyor" />
        </View>
      ) : items.length === 0 ? (
        <Text className="py-12 text-center font-body text-sm text-brand-neutral">
          Yeni bildirimin yok.
        </Text>
      ) : (
        items.map((item) => {
          const copy = notificationCopy(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => open(item)}
              className={`rounded-2xl border px-4 py-3.5 ${
                item.isRead
                  ? "border-border-default bg-surface-primary"
                  : "border-brand-primary/30 bg-brand-primary/10"
              }`}
            >
              <Text className="font-body text-sm font-semibold text-text-primary">
                {copy.title}
              </Text>
              {copy.body && copy.body !== copy.title ? (
                <Text className="mt-1 font-body text-xs text-brand-neutral">
                  {copy.body}
                </Text>
              ) : null}
            </Pressable>
          );
        })
      )}

      {isLoadingMore ? (
        <View className="items-center py-5">
          <SportLoader size={64} label="Bildirimler yükleniyor" />
        </View>
      ) : null}
    </AppScreen>
  );
}
