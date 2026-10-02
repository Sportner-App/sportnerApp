import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppText as Text,
  EmptyState,
  ErrorState,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { TabPage } from "@/features/app-shell/components/tab-page";
import { useActivityCopy } from "@/features/activity/copy";
import { useActivity } from "@/features/activity/hooks/use-activity";
import { EventCard } from "@/features/events/components/event-card";

export function ActivityScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const {
    tab,
    setTab,
    events,
    totalCount,
    tabCounts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = useActivity();
  const copy = useActivityCopy(tabCounts);

  const empty = copy.emptyCopy[tab];

  return (
    <TabPage
      refreshing={isRefreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
    >
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

      {isLoading ? (
        <ScreenLoader label={copy.loading} size={148} />
      ) : error && events.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : events.length === 0 ? (
        <EmptyState
          icon="calendar-check"
          message={empty.message}
          action={{
            label: empty.action,
            onPress: () => router.push(empty.href),
          }}
        />
      ) : (
        <View className="gap-3">
          <Text className="font-body-bold text-caption text-text-tertiary">
            {copy.eventCount(totalCount)}
          </Text>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => router.push(`/events/${event.id}`)}
            />
          ))}
          {isLoadingMore ? (
            <ScreenLoader label={copy.loadingMore} variant="more" />
          ) : null}
        </View>
      )}
    </TabPage>
  );
}
