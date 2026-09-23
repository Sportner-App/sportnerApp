import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  Avatar,
  brandRefreshControl,
  Button,
  LinearRefreshBar,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { getApiErrorMessage } from "@/lib/api/errors";
import { discoverUsers } from "@/services/users-service";
import type { DiscoverUser } from "@/types/users";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

function normalizeSearch(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function PeopleScreen() {
  const { t } = useTranslation(["people", "common", "events"]);
  const router = useRouter();
  const [people, setPeople] = useState<DiscoverUser[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const normalizedQuery = normalizeSearch(query);
  const isSearchPending = normalizedQuery !== debouncedSearch;

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(normalizedQuery),
      normalizedQuery ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  const load = useCallback(
    async (refresh = false) => {
      const requestId = ++requestIdRef.current;
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      try {
        setError(null);
        const result = await discoverUsers({
          page: 1,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        if (requestId !== requestIdRef.current) return;

        setPeople(result.items);
        setTotalCount(result.totalCount);
        setPage(result.page);
        setHasNext(result.hasNext);
      } catch (reason) {
        if (requestId !== requestIdRef.current) return;
        setError(getApiErrorMessage(reason, t("people:loadFailed")));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [debouncedSearch, t],
  );

  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading || isRefreshing || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      setError(null);
      const result = await discoverUsers({
        page: page + 1,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      setPeople((current) => {
        const knownIds = new Set(current.map((person) => person.userId));
        return [
          ...current,
          ...result.items.filter((person) => !knownIds.has(person.userId)),
        ];
      });
      setTotalCount(result.totalCount);
      setPage(result.page);
      setHasNext(result.hasNext);
    } catch (reason) {
      setError(getApiErrorMessage(reason, t("people:loadMoreFailed")));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    debouncedSearch,
    hasNext,
    isLoading,
    isLoadingMore,
    isRefreshing,
    page,
    t,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const initialLoading = isLoading && people.length === 0;
  const isSearching = debouncedSearch.length > 0;

  return (
    <AppScreen
      tone="light"
      header={
        <PeopleSearchHeader
          value={query}
          isLoading={
            isSearchPending || (isLoading && normalizedQuery.length > 0)
          }
          onChangeText={setQuery}
          onClear={() => setQuery("")}
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      scroll={false}
      contentClassName="pt-1"
    >
      {initialLoading ? (
        <View className="items-center py-16">
          <SportLoader
            size={148}
            label={isSearching ? t("people:searching") : t("people:loading")}
          />
        </View>
      ) : error && people.length === 0 ? (
        <View className="mx-5 items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <Text className="text-center font-body text-body-sm text-text-secondary">
            {error}
          </Text>
          <Button
            label={t("common:retry")}
            variant="outline"
            size="sm"
            onPress={() => void load()}
          />
        </View>
      ) : people.length === 0 ? (
        <View className="mx-5 items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6
            name={isSearching ? "user-slash" : "user-group"}
            size={22}
            color={themeColors.text.tertiary}
          />
          <Text className="text-center font-body text-body-sm text-text-secondary">
            {isSearching
              ? t("people:searchEmpty", { query: debouncedSearch })
              : t("people:empty")}
          </Text>
          {isSearching ? (
            <Button
              label={t("people:clearSearch")}
              variant="outline"
              size="sm"
              onPress={() => setQuery("")}
            />
          ) : null}
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(person) => person.userId}
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={brandRefreshControl({
            refreshing: isRefreshing,
            onRefresh: () => void load(true),
          })}
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="font-display text-heading-md text-text-primary">
                {isSearching
                  ? t("people:searchResults", { count: totalCount })
                  : t("people:heading")}
              </Text>
              <Text className="mt-0.5 font-body text-caption text-text-secondary">
                {isSearching
                  ? t("people:searchResultsSubtitle", {
                      query: debouncedSearch,
                    })
                  : t("people:subtitle")}
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
                <SportLoader size={64} label={t("people:loadingMore")} />
              </View>
            ) : error ? (
              <Pressable
                onPress={() => void loadMore()}
                className="items-center py-5 active:opacity-70"
              >
                <Text className="font-body text-caption text-text-secondary">
                  {t("people:loadMoreRetry", { error })}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </AppScreen>
  );
}

function PeopleSearchHeader({
  value,
  isLoading,
  onChangeText,
  onClear,
}: {
  value: string;
  isLoading: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation("people");

  return (
    <View className="flex-row items-center gap-3 border-b border-border-default px-5 pb-3 pt-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("back")}
        className="h-11 w-9 items-start justify-center active:opacity-65"
      >
        <FontAwesome6
          name="arrow-left"
          size={17}
          color={themeColors.text.primary}
        />
      </Pressable>

      <View className="h-11 flex-1 flex-row items-center gap-3 rounded-2xl bg-surface-secondary px-4">
        <FontAwesome6
          name="magnifying-glass"
          size={14}
          color={themeColors.text.secondary}
        />
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChangeText}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={themeColors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="flex-1 font-body text-body text-text-primary"
          accessibilityLabel={t("searchAccessibility")}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={themeColors.brand.primary} />
        ) : value.length > 0 ? (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("clearSearch")}
          >
            <FontAwesome6
              name="circle-xmark"
              size={16}
              color={themeColors.text.tertiary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PersonCard({
  person,
  onPress,
}: {
  person: DiscoverUser;
  onPress: () => void;
}) {
  const { t } = useTranslation("events");

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
          className="font-body-bold text-body-sm text-text-primary"
        >
          @{person.username || t("fallback.athleteHandle")}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-body text-caption text-text-secondary"
        >
          {person.name}
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
              className="font-body text-overline text-text-secondary"
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
