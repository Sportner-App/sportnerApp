import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
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
import { NOTIFICATION_ENTITY, NOTIFICATION_TYPE } from "@/types/notifications";

export function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (mode: "initial" | "refresh" | "more") => {
    if (mode === "initial") setIsLoading(true);
    if (mode === "refresh") setIsRefreshing(true);

    try {
      const page = await listNotifications({
        before: mode === "more" ? cursor ?? undefined : undefined,
      });
      setItems((prev) => (mode === "more" ? [...prev, ...page.items] : page.items));
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
    }
  }, [cursor, showToast]);

  useEffect(() => {
    void load("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
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
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => open(item)}
            className={`rounded-2xl border px-4 py-3.5 ${
              item.isRead
                ? "border-white/10 bg-brand-surface/70"
                : "border-brand-primary/30 bg-brand-primary/10"
            }`}
          >
            <Text className="font-body text-sm font-semibold text-white">
              {item.title}
            </Text>
            <Text className="mt-1 font-body text-xs text-brand-neutral">
              {item.body}
            </Text>
          </Pressable>
        ))
      )}

      {cursor ? (
        <Button
          label="Daha fazla"
          variant="outline"
          size="sm"
          onPress={() => load("more")}
        />
      ) : null}
    </AppScreen>
  );
}
