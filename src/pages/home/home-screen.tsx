import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useSession } from "@/contexts";
import { useEvents } from "@/hooks/use-events";

import { EventCard } from "./event-card";
import { Hero } from "./hero";
import { SportFilter } from "./sport-filter";

export function HomeScreen() {
  const router = useRouter();
  const { user } = useSession();
  const {
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    sportFilter,
    setSportFilter,
    refresh,
    loadMore,
  } = useEvents();

  const firstName = user?.fullName?.split(" ")[0] || "Sporcu";

  return (
    <AppScreen
      withTabBar
      header={
        <ScreenHeader
          brand
          right={
            <Pressable
              hitSlop={8}
              onPress={() => router.push("/notifications")}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-brand-surface/90 active:opacity-80"
            >
              <FontAwesome6 name="bell" size={15} color="#64748b" />
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-6 px-6 pt-4"
      refreshControl={
        <BrandRefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <Hero
        name={firstName}
        onCreatePress={() => router.push("/events/create")}
      />

      <Animated.View
        entering={FadeInDown.duration(500).delay(160)}
        className="gap-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-xl text-white">
            Yaklaşan Etkinlikler
          </Text>
          <Text className="font-mono text-xs text-brand-neutral">
            {totalCount} etkinlik
          </Text>
        </View>

        <SportFilter value={sportFilter} onChange={setSportFilter} />
      </Animated.View>

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Etkinlikler yükleniyor" />
        </View>
      ) : events.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-12">
          <FontAwesome6 name="calendar-xmark" size={22} color="#64748b" />
          <Text className="font-body text-sm text-brand-neutral">
            Bu spor için yaklaşan etkinlik yok.
          </Text>
        </View>
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
