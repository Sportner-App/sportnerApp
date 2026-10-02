import { useCallback, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  brandRefreshControl,
  Button,
  EmptyState,
  LinearRefreshBar,
  ScreenHeader,
  ScreenLoader,
  UserIdentity,
} from "@/components";
import { useToast } from "@/contexts";
import { useRefreshableLoad } from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  listBlockedUsers,
  unblockUser,
} from "@/features/social/services/social-service";
import type { ApiBlockedUser } from "@/features/social/types";

export function BlockedUsersScreen() {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiBlockedUser[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await listBlockedUsers();
      setItems(page?.items ?? []);
    } catch (error) {
      showToast({
        type: "error",
        title: t("blocked.loadFailed"),
        description: getApiErrorMessage(error),
      });
    }
  }, [showToast, t]);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "mount",
  });

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setItems((current) => current.filter((item) => item.userId !== userId));
      showToast({ type: "success", title: t("blocked.unblocked") });
    } catch (error) {
      showToast({
        type: "error",
        title: t("blocked.unblockFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("blocked.title")} showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: refresh,
      })}
    >
      <Text className="font-body text-body-sm text-text-tertiary">
        {t("blocked.description")}
      </Text>

      {isLoading ? (
        <ScreenLoader />
      ) : items.length === 0 ? (
        <EmptyState variant="inline" message={t("blocked.empty")} />
      ) : (
        items.map((item) => (
          <View
            key={item.userId}
            className="flex-row items-center gap-2 rounded-2xl border border-border-default bg-surface-primary px-4 py-3"
          >
            <View className="min-w-0 flex-1">
              <UserIdentity
                username={item.username}
                avatarUrl={item.profileImageUrl}
                fallbackName={item.firstName}
              />
            </View>
            <Button
              label={t("blocked.remove")}
              variant="outline"
              size="sm"
              isLoading={unblockingId === item.userId}
              disabled={unblockingId !== null}
              onPress={() => void handleUnblock(item.userId)}
            />
          </View>
        ))
      )}
    </AppScreen>
  );
}
