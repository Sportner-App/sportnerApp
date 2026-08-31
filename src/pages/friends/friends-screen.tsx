import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
  UserIdentity,
} from "@/components";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  acceptFriendRequest,
  listFriends,
  listFriendSuggestions,
  listPendingRequests,
  rejectFriendRequest,
} from "@/services/social-service";
import type {
  ApiFriend,
  ApiFriendship,
  ApiFriendSuggestion,
} from "@/types/social";

type Tab = "friends" | "requests" | "suggestions";

export function FriendsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [requests, setRequests] = useState<ApiFriendship[]>([]);
  const [suggestions, setSuggestions] = useState<ApiFriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);
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

  useFocusEffect(
    useCallback(() => {
      void load(hasLoaded.current ? "refresh" : "initial").finally(() => {
        hasLoaded.current = true;
      });
    }, [load]),
  );

  return (
    <AppScreen
      header={<ScreenHeader title="ARKADAŞLAR" showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
    >
      <SegmentedTabs
        options={[
          { key: "friends", label: "Liste" },
          { key: "requests", label: "İstekler" },
          { key: "suggestions", label: "Öneriler" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <Text className="py-8 text-center font-body text-sm text-brand-neutral">
            Henüz arkadaşın yok.
          </Text>
        ) : (
          friends.map((item) => (
            <PersonRow
              key={item.friendshipId}
              username={item.username}
              avatarUrl={item.profileImageUrl}
              fallbackName={item.firstName}
              onPress={() => router.push(`/users/${item.userId}`)}
            />
          ))
        )
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <Text className="py-8 text-center font-body text-sm text-brand-neutral">
            Bekleyen istek yok.
          </Text>
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
                  label="Kabul"
                  size="sm"
                  onPress={async () => {
                    try {
                      await acceptFriendRequest(item.id);
                      await load("refresh");
                    } catch (error) {
                      showToast({
                        type: "error",
                        title: "Kabul edilemedi",
                        description: getApiErrorMessage(error),
                      });
                    }
                  }}
                />
                <Button
                  label="Reddet"
                  variant="outline"
                  size="sm"
                  onPress={async () => {
                    try {
                      await rejectFriendRequest(item.id);
                      await load("refresh");
                    } catch (error) {
                      showToast({
                        type: "error",
                        title: "Reddedilemedi",
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
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          Öneri yok.
        </Text>
      ) : (
        suggestions.map((item) => (
          <PersonRow
            key={item.userId}
            username={item.username}
            avatarUrl={item.profileImageUrl}
            fallbackName={item.firstName}
            subtitle={`${item.sharedSportsCount} ortak spor`}
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
