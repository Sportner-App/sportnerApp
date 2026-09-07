import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Button, SegmentedTabs, SportLoader, TabPage } from "@/components";
import { useActivityCopy } from "@/constants/activity";
import { useActivity } from "@/hooks/use-activity";
import { EventCard } from "@/pages/home/event-card";

export function ActivityScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const copy = useActivityCopy();
  const {
    tab,
    setTab,
    events,
    totalCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = useActivity();

  const empty = copy.emptyCopy[tab];

  return (
    <TabPage
      refreshing={isRefreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
    >
      <View className="gap-2">
        <Text className="font-display text-3xl text-text-primary">
          {copy.title}
        </Text>
        <Text className="font-body text-sm text-brand-neutral">
          {copy.subtitle}
        </Text>
      </View>

      <SegmentedTabs options={copy.tabs} value={tab} onChange={setTab} />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label={copy.loading} />
        </View>
      ) : error && events.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6 name="triangle-exclamation" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {error}
          </Text>
          <Button
            label={t("retry")}
            variant="outline"
            size="sm"
            onPress={refresh}
          />
        </View>
      ) : events.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6 name="calendar-check" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {empty.message}
          </Text>
          <Button
            label={empty.action}
            variant="outline"
            size="sm"
            onPress={() => router.push(empty.href)}
          />
        </View>
      ) : (
        <View className="gap-3">
          <Text className="font-mono text-xs text-brand-neutral">
            {copy.eventCount(totalCount)}
          </Text>
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onPress={() => router.push(`/events/${event.id}`)}
            />
          ))}
          {isLoadingMore ? (
            <View className="items-center py-5">
              <SportLoader size={64} label={copy.loadingMore} />
            </View>
          ) : null}
        </View>
      )}
    </TabPage>
  );
}
