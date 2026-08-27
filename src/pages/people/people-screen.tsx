import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Avatar,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { discoverUsers } from "@/services/users-service";
import type { DiscoverUser } from "@/types/users";

const PAGE_SIZE = 20;

export function PeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<DiscoverUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setError(null);
      const result = await discoverUsers({ page: 1, pageSize: PAGE_SIZE });
      setPeople(result.items);
      setPage(result.page);
      setHasNext(result.hasNext);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Sporcular yüklenemedi."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading || isRefreshing || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      setError(null);
      const result = await discoverUsers({
        page: page + 1,
        pageSize: PAGE_SIZE,
      });
      setPeople((current) => {
        const knownIds = new Set(current.map((person) => person.userId));
        return [
          ...current,
          ...result.items.filter((person) => !knownIds.has(person.userId)),
        ];
      });
      setPage(result.page);
      setHasNext(result.hasNext);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Daha fazla sporcu yüklenemedi."));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNext, isLoading, isLoadingMore, isRefreshing, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen
      tone="light"
      header={<ScreenHeader title="SPORCULAR" showBack tone="light" />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      scroll={false}
      contentClassName="pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Sporcular yükleniyor" />
        </View>
      ) : error && people.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <Text className="text-center font-body text-sm text-text-secondary">
            {error}
          </Text>
          <Button
            label="Tekrar Dene"
            variant="outline"
            size="sm"
            onPress={() => void load()}
          />
        </View>
      ) : people.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6
            name="user-group"
            size={22}
            color={themeColors.text.tertiary}
          />
          <Text className="text-center font-body text-sm text-text-secondary">
            Şimdilik keşfedilecek yeni sporcu yok.
          </Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(person) => person.userId}
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <BrandRefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(true)}
            />
          }
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="font-display text-[24px] text-text-primary">
                Tüm sporcular
              </Text>
              <Text className="mt-0.5 font-body text-xs text-text-secondary">
                Topluluktaki aktif ve herkese açık profilleri keşfet.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View className="ml-[60px] h-px bg-border-default opacity-60" />
          )}
          renderItem={({ item }) => (
            <PersonCard
              person={item}
              onPress={() => router.push(`/users/${item.userId}`)}
            />
          )}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="items-center py-5">
                <SportLoader size={64} label="Sporcular yükleniyor" />
              </View>
            ) : error ? (
              <Pressable
                onPress={() => void loadMore()}
                className="items-center py-5 active:opacity-70"
              >
                <Text className="font-body text-xs text-text-secondary">
                  {error} Tekrar denemek için dokun.
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </AppScreen>
  );
}

function PersonCard({
  person,
  onPress,
}: {
  person: DiscoverUser;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[68px] flex-row items-center gap-3 py-2.5 active:opacity-65"
    >
      <Avatar
        uri={person.avatarUrl}
        name={person.name}
        size={48}
        borderWidth={1.5}
      />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-body-bold text-sm text-text-primary"
        >
          @{person.username || "sporcu"}
        </Text>
      </View>
      <View className="max-w-[92px] flex-row items-center gap-1">
        {person.city ? (
          <>
            <FontAwesome6
              name="location-dot"
              size={9}
              color={themeColors.brand.primary}
            />
            <Text
              numberOfLines={1}
              className="font-body text-[10px] text-text-secondary"
            >
              {person.city}
            </Text>
          </>
        ) : null}
      </View>
      <FontAwesome6
        name="chevron-right"
        size={10}
        color={themeColors.text.tertiary}
      />
    </Pressable>
  );
}
