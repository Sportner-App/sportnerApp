import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  AppTextInput,
  Avatar,
  brandRefreshControl,
  EmptyState,
  ErrorState,
  LinearRefreshBar,
  ScreenLoader,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/lib/api/errors";
import { discoverUsers } from "@/features/social/services/users-service";
import type { DiscoverUser } from "@/features/social/types";
import { formatHandle } from "@/utils/person";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

/** Sunucu araması için: baştaki @ işaretleri kullanıcı adının parçası değil. */
function toPeopleSearchQuery(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function PeopleScreen() {
  const { t } = useTranslation(["people", "common", "events"]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = toPeopleSearchQuery(query);
  const isSearchPending = normalizedQuery !== debouncedSearch;

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(normalizedQuery),
      normalizedQuery ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  const fetchPage = useCallback(
    async (page: number | null) => {
      setError(null);
      const result = await discoverUsers({
        page: page ?? 1,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      return {
        items: result.items,
        nextCursor: result.hasNext ? result.page + 1 : null,
        totalCount: result.totalCount,
      };
    },
    [debouncedSearch],
  );

  const {
    items: people,
    totalCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    refresh,
    reload,
    loadMore,
  } = usePaginatedList<DiscoverUser, number>(fetchPage, {
    getKey: (person) => person.userId,
    onError: (reason, mode) =>
      setError(
        getApiErrorMessage(
          reason,
          t(mode === "more" ? "people:loadMoreFailed" : "people:loadFailed"),
        ),
      ),
  });

  const initialLoading = isLoading && people.length === 0;
  const isSearching = debouncedSearch.length > 0;

  return (
    <AppScreen
      tone="light"
      // Klavyeye göre yeniden boyutlanma kapalı: tek giriş alanı başlıkta,
      // zaten klavyenin üstünde. Açıkken gövdeye eklenen dolgu, kaydırma
      // sırasında klavye kapanınca listeyi yerinden oynatıyordu.
      keyboardAvoiding={false}
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
        <ScreenLoader
          size={148}
          label={isSearching ? t("people:searching") : t("people:loading")}
        />
      ) : error && people.length === 0 ? (
        <ErrorState
          message={error}
          onRetry={() => void reload()}
          className="mx-5"
        />
      ) : people.length === 0 ? (
        <EmptyState
          icon={isSearching ? "user-slash" : "user-group"}
          message={
            isSearching
              ? t("people:searchEmpty", { query: debouncedSearch })
              : t("people:empty")
          }
          className="mx-5"
          action={
            isSearching
              ? { label: t("people:clearSearch"), onPress: () => setQuery("") }
              : undefined
          }
        />
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
            onRefresh: refresh,
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isLoadingMore ? (
              <ScreenLoader label={t("people:loadingMore")} variant="more" />
            ) : error ? (
              <Pressable
                onPress={loadMore}
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
        hitSlop={HIT_SLOP}
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
        <AppTextInput
          // Otomatik odak yok: kullanıcı bu ekrana listeye bakmaya geliyor,
          // açılışta klavyenin yarım ekranı kaplaması aramayı kolaylaştırmıyor.
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
          {formatHandle(person.username)}
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
