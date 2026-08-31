import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
  UserIdentity,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listBlockedUsers, unblockUser } from "@/services/social-service";
import type { ApiBlockedUser } from "@/types/social";

export function BlockedUsersScreen() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ApiBlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const page = await listBlockedUsers();
        setItems(page?.items ?? []);
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
    },
    [showToast],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setItems((current) => current.filter((item) => item.userId !== userId));
      showToast({ type: "success", title: "Engel kaldırıldı" });
    } catch (error) {
      showToast({
        type: "error",
        title: "Kaldırılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="ENGELLENENLER" showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
    >
      <Text className="font-body text-sm text-brand-neutral">
        Engellediğin kişiler seni ve sen onları göremez. İstediğin zaman engeli
        kaldırabilirsin.
      </Text>

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : items.length === 0 ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          Engellenen kimse yok.
        </Text>
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
              label="Kaldır"
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
