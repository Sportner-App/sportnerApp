import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button, SportLoader, TabPage } from "@/components";
import { themeColors } from "@/constants/theme";
import { useEvents } from "@/hooks/use-events";
import { useRequireAuth } from "@/hooks/use-require-auth";

import { EventCard } from "./event-card";
import { EventFilterSheet } from "./event-filter-sheet";
import { Hero } from "./hero";
import { SportFilter } from "./sport-filter";

export function HomeScreen() {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const { requireAuth } = useRequireAuth();
  const {
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    sportFilter,
    setSportFilter,
    filters,
    applyFilters,
    refresh,
    loadMore,
  } = useEvents();

  return (
    <TabPage refreshing={isRefreshing} onRefresh={refresh}>
      <Hero
        onCreatePress={() =>
          requireAuth("Etkinlik oluşturmak için giriş yapmalısın.") &&
          router.push("/events/create")
        }
      />

      <Animated.View
        entering={FadeInDown.duration(500).delay(60)}
        className="gap-md"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[24px] leading-[30px] text-text-primary">
            Yaklaşan Etkinlikler
          </Text>
          <View className="flex-row gap-sm">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtreler"
              onPress={() => setFilterOpen(true)}
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
            >
              <FontAwesome6
                name="sliders"
                size={17}
                color={themeColors.text.primary}
              />
              {filters.minAge !== 13 ||
              filters.maxAge !== 120 ||
              filters.gender != null ||
              filters.skillLevel != null ||
              filters.isPaid != null ? (
                <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background-primary bg-brand-primary" />
              ) : null}
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-sm">
          <FontAwesome6
            name="location-dot"
            size={14}
            color={themeColors.text.primary}
          />
          <Text className="font-body-bold text-[15px] text-text-primary">
            Yakınındaki etkinlikler
          </Text>
          <FontAwesome6
            name="chevron-down"
            size={11}
            color={themeColors.text.primary}
          />
        </View>

        <SportFilter value={sportFilter} onChange={setSportFilter} />
        <Text className="font-mono text-caption text-text-tertiary">
          {totalCount} etkinlik bulundu
        </Text>
      </Animated.View>

      {isLoading ? (
        <View className="items-center py-3xl">
          <SportLoader size={148} label="Etkinlikler yükleniyor" />
        </View>
      ) : events.length === 0 ? (
        <View className="items-center gap-sm rounded-xlarge border border-border-default bg-surface-primary px-xl py-3xl">
          <FontAwesome6
            name="calendar-xmark"
            size={22}
            color={themeColors.text.secondary}
          />
          <Text className="text-center font-body text-body-sm text-text-secondary">
            Bu filtrelere uygun yaklaşan etkinlik yok.
          </Text>
        </View>
      ) : (
        <View className="gap-lg">
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

      <EventFilterSheet
        visible={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
      />
    </TabPage>
  );
}
