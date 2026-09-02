import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Button, SegmentedTabs, SportLoader, TabPage } from "@/components";
import { type ActivityTab, useActivity } from "@/hooks/use-activity";
import { EventCard } from "@/pages/home/event-card";

const TABS: { key: ActivityTab; label: string }[] = [
  { key: "upcoming", label: "Devam eden" },
  { key: "past", label: "Geçmiş" },
  { key: "organized", label: "Düzenlediklerim" },
];

const EMPTY_COPY: Record<
  ActivityTab,
  { message: string; action: string; href: "/events/create" | "/(tabs)" }
> = {
  upcoming: {
    message: "Şu an devam eden veya yaklaşan bir katılımın yok.",
    action: "Etkinlikleri Gör",
    href: "/(tabs)",
  },
  past: {
    message: "Henüz geçmiş bir etkinliğin yok.",
    action: "Etkinlikleri Gör",
    href: "/(tabs)",
  },
  organized: {
    message: "Henüz düzenlediğin bir etkinlik yok.",
    action: "Etkinlik Oluştur",
    href: "/events/create",
  },
};

export function ActivityScreen() {
  const router = useRouter();
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

  const empty = EMPTY_COPY[tab];

  return (
    <TabPage
      refreshing={isRefreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
    >
      <View className="gap-2">
        <Text className="font-display text-3xl text-text-primary">
          Etkinliklerim
        </Text>
        <Text className="font-body text-sm text-brand-neutral">
          Devam edenler, geçmiştekiler ve düzenlediklerin.
        </Text>
      </View>

      <SegmentedTabs options={TABS} value={tab} onChange={setTab} />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Etkinlikler yükleniyor" />
        </View>
      ) : error && events.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6 name="triangle-exclamation" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {error}
          </Text>
          <Button
            label="Tekrar Dene"
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
            {totalCount} etkinlik
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
              <SportLoader size={64} label="Etkinlikler yükleniyor" />
            </View>
          ) : null}
        </View>
      )}
    </TabPage>
  );
}
