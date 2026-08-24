import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { useActivity } from "@/hooks/use-activity";
import { EventCard } from "@/pages/home/event-card";

const TABS = [
  { key: "participating" as const, label: "Katıldıklarım" },
  { key: "organized" as const, label: "Düzenlediklerim" },
];

export function ActivityScreen() {
  const router = useRouter();
  const {
    tab,
    setTab,
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = useActivity();

  return (
    <AppScreen
      withTabBar
      header={<ScreenHeader title="AKTİVİTE" />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-5 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <View className="gap-2">
        <Text className="font-display text-3xl text-white">Aktiviten</Text>
        <Text className="font-body text-sm text-brand-neutral">
          Katıldığın ve düzenlediğin etkinlikler.
        </Text>
      </View>

      <SegmentedTabs options={TABS} value={tab} onChange={setTab} />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Aktiviteler yükleniyor" />
        </View>
      ) : error && events.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-12">
          <FontAwesome6 name="triangle-exclamation" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {error}
          </Text>
          <Button label="Tekrar Dene" variant="outline" size="sm" onPress={refresh} />
        </View>
      ) : events.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-12">
          <FontAwesome6 name="calendar-check" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
            {tab === "organized"
              ? "Henüz düzenlediğin bir etkinlik yok."
              : "Henüz katıldığın bir etkinlik yok."}
          </Text>
          <Button
            label={tab === "organized" ? "Etkinlik Oluştur" : "Etkinlikleri Gör"}
            variant="outline"
            size="sm"
            onPress={() =>
              router.push(tab === "organized" ? "/events/create" : "/(tabs)")
            }
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
          {hasNext ? (
            <Button
              label="Daha fazla yükle"
              variant="outline"
              size="sm"
              isLoading={isLoadingMore}
              onPress={loadMore}
            />
          ) : null}
        </View>
      )}
    </AppScreen>
  );
}
