import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  brandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/services/notifications-service";
import type { ApiNotification } from "@/features/notifications/types";
import {
  NOTIFICATION_TYPE,
  notificationCopy,
} from "@/features/notifications/types";
import { resolveNotificationRoute } from "@/features/notifications/notification-routing";

export function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation(["notifications", "common"]);
  const fetchPage = useCallback(async (cursor: string | null) => {
    const page = await listNotifications({ before: cursor ?? undefined });
    return { items: page.items, nextCursor: page.nextCursor };
  }, []);

  const {
    items,
    setItems,
    isLoading,
    isRefreshing,
    isLoadingMore,
    refresh,
    loadMore,
  } = usePaginatedList<ApiNotification, string>(fetchPage, {
    onError: (error) =>
      showToast({
        type: "error",
        title: t("notifications:loadFailed"),
        description: getApiErrorMessage(error),
      }),
  });

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
      router.push(`/users/${friendUserId}` as never);
      return;
    }

    router.push(resolveNotificationRoute(item) as never);
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t("notifications:title")}
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
              <Text className="font-body text-caption text-brand-primary">
                {t("notifications:markAllRead")}
              </Text>
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-3 px-6 pt-2"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: refresh,
      })}
      onEndReached={loadMore}
    >
      {isLoading ? (
        <ScreenLoader label={t("notifications:loading")} />
      ) : items.length === 0 ? (
        <Text className="py-12 text-center font-body text-body-sm text-text-tertiary">
          {t("notifications:empty")}
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
              <Text className="font-body-bold text-body-sm text-text-primary">
                {copy.title}
              </Text>
              {copy.body && copy.body !== copy.title ? (
                <Text className="mt-1 font-body text-caption text-text-tertiary">
                  {copy.body}
                </Text>
              ) : null}
            </Pressable>
          );
        })
      )}

      {isLoadingMore ? (
        <ScreenLoader label={t("notifications:loading")} variant="more" />
      ) : null}
    </AppScreen>
  );
}
