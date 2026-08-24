import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { useDiscover } from "@/hooks/use-discover";
import { EventCard } from "@/pages/home/event-card";
import { SportFilter } from "@/pages/home/sport-filter";

const TABS = [
  { key: "events" as const, label: "Etkinlikler" },
  { key: "people" as const, label: "Sporcular" },
];

export function DiscoverScreen() {
  const router = useRouter();
  const {
    tab,
    setTab,
    city,
    setCity,
    sportSlug,
    setSportSlug,
    events,
    people,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useDiscover();

  return (
    <AppScreen
      withTabBar
      header={<ScreenHeader title="KEŞFET" />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-5 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <View className="gap-1.5">
        <Text className="font-display text-3xl text-white">Keşfet</Text>
        <Text className="font-body text-sm text-brand-neutral">
          Yakındaki etkinlikler ve sporcular.
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3">
        <FontAwesome6 name="location-dot" size={14} color="#64748b" />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Şehir ara…"
          placeholderTextColor="#64748b"
          className="flex-1 font-body text-base text-white"
        />
        {city.length > 0 ? (
          <Pressable onPress={() => setCity("")}>
            <FontAwesome6 name="xmark" size={14} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      <SportFilter value={sportSlug} onChange={setSportSlug} />
      <SegmentedTabs options={TABS} value={tab} onChange={setTab} />

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Keşfet yükleniyor" />
        </View>
      ) : error ? (
        <View className="items-center gap-3 rounded-3xl border border-white/10 px-6 py-12">
          <Text className="text-center font-body text-sm text-brand-neutral">
            {error}
          </Text>
          <Button label="Tekrar Dene" variant="outline" size="sm" onPress={refresh} />
        </View>
      ) : tab === "events" ? (
        events.length === 0 ? (
          <EmptyState text="Bu filtreye uygun etkinlik yok." />
        ) : (
          <View className="gap-3">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                onPress={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </View>
        )
      ) : people.length === 0 ? (
        <EmptyState text="Bu filtreye uygun sporcu yok." />
      ) : (
        <View className="gap-3">
          {people.map((person) => (
            <Pressable
              key={person.userId}
              onPress={() => router.push(`/users/${person.userId}`)}
              className="flex-row items-center gap-3 rounded-3xl border border-white/10 bg-brand-surface/90 p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-primary/15">
                <Text className="font-display text-sm text-brand-primary">
                  {(person.firstName || person.username || "S")
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-body text-base font-semibold text-white">
                  {person.name}
                </Text>
                <Text className="font-body text-xs text-brand-neutral">
                  {person.city ? `${person.city} · ` : ""}
                  {person.sharedSportsCount} ortak spor
                  {person.mutualFriendsCount > 0
                    ? ` · ${person.mutualFriendsCount} ortak arkadaş`
                    : ""}
                </Text>
              </View>
              <FontAwesome6 name="chevron-right" size={12} color="#64748b" />
            </Pressable>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View className="items-center gap-2 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-12">
      <FontAwesome6 name="compass" size={22} color="#64748b" />
      <Text className="text-center font-body text-sm text-brand-neutral">
        {text}
      </Text>
    </View>
  );
}
