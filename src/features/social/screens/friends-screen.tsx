import { useRouter } from "expo-router";
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
  SegmentedTabs,
  UserIdentity,
} from "@/components";
import { useSession, useToast } from "@/contexts";
import { useRefreshableLoad } from "@/hooks/use-refreshable-load";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  acceptFriendRequest,
  listFriends,
  listFriendSuggestions,
  listPendingRequests,
  rejectFriendRequest,
  removeFriendship,
} from "@/features/social/services/social-service";
import type {
  ApiFriend,
  ApiFriendship,
  ApiFriendSuggestion,
} from "@/features/social/types";

type Tab = "friends" | "requests" | "suggestions";

export function FriendsScreen() {
  const { t } = useTranslation("friends");
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [requests, setRequests] = useState<ApiFriendship[]>([]);
  const [suggestions, setSuggestions] = useState<ApiFriendSuggestion[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [friendPage, incoming, suggested] = await Promise.all([
        listFriends(),
        listPendingRequests(false),
        listFriendSuggestions(),
      ]);
      setFriends(friendPage?.items ?? []);
      setRequests(incoming);
      setSuggestions(suggested);
    } catch (error) {
      showToast({
        type: "error",
        title: t("toasts.loadFailedTitle"),
        description: getApiErrorMessage(error),
      });
    }
  }, [showToast, t]);

  const { isLoading, isRefreshing, refresh } = useRefreshableLoad(load, {
    trigger: "focus",
  });

  const handleRemove = async (friendshipId: string) => {
    setRemovingId(friendshipId);
    try {
      await removeFriendship(friendshipId);
      setFriends((current) =>
        current.filter((item) => item.friendshipId !== friendshipId),
      );
      showToast({ type: "success", title: t("toasts.removedTitle") });
    } catch (error) {
      showToast({
        type: "error",
        title: t("toasts.removeFailedTitle"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("title")} showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: refresh,
      })}
    >
      <SegmentedTabs
        options={[
          { key: "friends", label: t("tabs.friends") },
          {
            key: "requests",
            label: t("tabs.requests"),
            badge: requests.length > 0 ? requests.length : undefined,
          },
          { key: "suggestions", label: t("tabs.suggestions") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <ScreenLoader label={t("loading")} />
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <EmptyState variant="inline" message={t("empty.friends")} />
        ) : (
          friends.map((item) => (
            <View
              key={item.friendshipId}
              className="flex-row items-center gap-2 rounded-2xl border border-border-default bg-surface-primary px-4 py-3"
            >
              <View className="min-w-0 flex-1">
                <UserIdentity
                  username={item.username}
                  avatarUrl={item.profileImageUrl}
                  fallbackName={item.firstName}
                  onPress={() => router.push(`/users/${item.userId}`)}
                />
              </View>
              <Button
                label={t("actions.remove")}
                variant="dangerOutline"
                size="sm"
                isLoading={removingId === item.friendshipId}
                disabled={removingId !== null}
                onPress={() => void handleRemove(item.friendshipId)}
              />
            </View>
          ))
        )
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <EmptyState variant="inline" message={t("empty.requests")} />
        ) : (
          requests.map((item) => {
            const otherId =
              item.requesterUserId === user?.id
                ? item.addresseeUserId
                : item.requesterUserId;
            const username =
              item.requesterUserId === user?.id
                ? item.addresseeUsername
                : item.requesterUsername;
            const firstName =
              item.requesterUserId === user?.id
                ? item.addresseeFirstName
                : item.requesterFirstName;
            const avatarUrl =
              item.requesterUserId === user?.id
                ? item.addresseeProfileImageUrl
                : item.requesterProfileImageUrl;
            return (
              <View
                key={item.id}
                className="flex-row items-center gap-2 rounded-2xl border border-border-default p-3"
              >
                <View className="min-w-0 flex-1">
                  <UserIdentity
                    username={username}
                    avatarUrl={avatarUrl}
                    fallbackName={firstName}
                    onPress={() => router.push(`/users/${otherId}`)}
                  />
                </View>
                <Button
                  label={t("actions.accept")}
                  size="sm"
                  onPress={async () => {
                    try {
                      await acceptFriendRequest(item.id);
                      await refresh();
                    } catch (error) {
                      showToast({
                        type: "error",
                        title: t("toasts.acceptFailedTitle"),
                        description: getApiErrorMessage(error),
                      });
                    }
                  }}
                />
                <Button
                  label={t("actions.reject")}
                  variant="dangerOutline"
                  size="sm"
                  onPress={async () => {
                    try {
                      await rejectFriendRequest(item.id);
                      await refresh();
                    } catch (error) {
                      showToast({
                        type: "error",
                        title: t("toasts.rejectFailedTitle"),
                        description: getApiErrorMessage(error),
                      });
                    }
                  }}
                />
              </View>
            );
          })
        )
      ) : suggestions.length === 0 ? (
        <EmptyState variant="inline" message={t("empty.suggestions")} />
      ) : (
        suggestions.map((item) => (
          <PersonRow
            key={item.userId}
            username={item.username}
            avatarUrl={item.profileImageUrl}
            fallbackName={item.firstName}
            subtitle={t("sharedSports", { count: item.sharedSportsCount })}
            onPress={() => router.push(`/users/${item.userId}`)}
          />
        ))
      )}
    </AppScreen>
  );
}

function PersonRow({
  username,
  avatarUrl,
  fallbackName,
  subtitle,
  onPress,
}: {
  username?: string | null;
  avatarUrl?: string | null;
  fallbackName?: string | null;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <View className="rounded-2xl border border-border-default bg-surface-primary px-4 py-3">
      <UserIdentity
        username={username}
        avatarUrl={avatarUrl}
        fallbackName={fallbackName}
        meta={subtitle}
        onPress={onPress}
      />
    </View>
  );
}
