import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

import {
  AppText as Text,
  EmptyState,
  ErrorState,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import {
  TabListItem,
  TabListPage,
} from "@/features/app-shell/components/tab-list-page";
import { useActivityCopy } from "@/features/activity/copy";
import {
  useActivity,
  type ActivityTab,
} from "@/features/activity/hooks/use-activity";
import { EventCard } from "@/features/events/components/event-card";
import type { EventSummary } from "@/features/events/types";

const TABS: ActivityTab[] = ["upcoming", "past", "pending", "organized"];

/**
 * Etkinliklerim. Liste sanallaştırılmış (FlashList): sekme değişince yalnızca
 * ekrandaki birkaç kartın içeriği değişiyor, kart sayısı ne olursa olsun
 * geçiş aynı hızda. Liste değişimi ikinci planda render ediliyor
 * (`listTab`), sekme göstergesi dokunuşu beklemeden kayıyor.
 */
export function ActivityScreen() {
  const router = useRouter();
  // Profildeki istatistiklerden gelen bağlantılar doğrudan ilgili sekmeyi açar.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = TABS.includes(tabParam as ActivityTab)
    ? (tabParam as ActivityTab)
    : "upcoming";
  const {
    tab,
    setTab,
    listTab,
    events,
    totalCount,
    tabCounts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = useActivity(initialTab);
  const copy = useActivityCopy(tabCounts);
  // Boş durum metni listeyle aynı (ertelenmiş) sekmeden gelsin.
  const empty = copy.emptyCopy[listTab];

  const openEvent = useCallback(
    (eventId: string) => router.push(`/events/${eventId}`),
    [router],
  );
  const renderEvent = useCallback(
    ({ item }: { item: EventSummary }) => (
      <TabListItem>
        <EventCard event={item} onPressEvent={openEvent} />
      </TabListItem>
    ),
    [openEvent],
  );

  return (
    <TabListPage
      data={isLoading ? [] : events}
      keyExtractor={(event) => event.id}
      renderItem={renderEvent}
      itemGap={12}
      refreshing={isRefreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
      header={
        <>
          <View className="gap-2">
            <Text className="font-display text-heading-lg text-text-primary">
              {copy.title}
            </Text>
            <Text className="font-body text-body-sm text-text-tertiary">
              {copy.subtitle}
            </Text>
          </View>

          <SegmentedTabs
            options={copy.tabs}
            value={tab}
            badgePlacement="top"
            onChange={setTab}
          />

          {!isLoading && events.length > 0 ? (
            <Text className="-mb-3 font-body-bold text-caption text-text-tertiary">
              {copy.eventCount(totalCount)}
            </Text>
          ) : null}
        </>
      }
      empty={
        isLoading ? (
          <ScreenLoader label={copy.loading} size={148} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <EmptyState
            icon="calendar-check"
            message={empty.message}
            action={{
              label: empty.action,
              onPress: () => router.push(empty.href),
            }}
          />
        )
      }
      footer={
        isLoadingMore ? (
          <ScreenLoader label={copy.loadingMore} variant="more" />
        ) : null
      }
    />
  );
}
