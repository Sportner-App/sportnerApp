import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
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

  useEffect(() => {
    void load("initial");
  }, [load]);

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
              name={item.firstName || item.username || "Sporcu"}
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
            const name =
              item.requesterUserId === user?.id
                ? item.addresseeFirstName || item.addresseeUsername
                : item.requesterFirstName || item.requesterUsername;
            return (
              <View
                key={item.id}
                className="flex-row items-center gap-2 rounded-2xl border border-white/10 p-3"
              >
                <Pressable
                  className="flex-1"
                  onPress={() => router.push(`/users/${otherId}`)}
                >
                  <Text className="font-body text-sm text-white">{name}</Text>
                </Pressable>
                <Button
                  label="Kabul"
                  size="sm"
                  onPress={async () => {
                    await acceptFriendRequest(item.id);
                    await load("refresh");
                  }}
                />
                <Button
                  label="Reddet"
                  variant="outline"
                  size="sm"
                  onPress={async () => {
                    await rejectFriendRequest(item.id);
                    await load("refresh");
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
            name={item.firstName || item.username || "Sporcu"}
            subtitle={`${item.sharedSportsCount} ortak spor`}
            onPress={() => router.push(`/users/${item.userId}`)}
          />
        ))
      )}
    </AppScreen>
  );
}

function PersonRow({
  name,
  subtitle,
  onPress,
}: {
  name: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3.5"
    >
      <Text className="font-body text-sm font-semibold text-white">{name}</Text>
      {subtitle ? (
        <Text className="mt-0.5 font-body text-xs text-brand-neutral">
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}
