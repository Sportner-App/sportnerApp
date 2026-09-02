import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button, SegmentedTabs, SportLoader, TabPage } from "@/components";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts";
import {
  DEFAULT_EVENT_FILTERS,
  type EventFeedScope,
  useEvents,
} from "@/hooks/use-events";
import { useMyOrganizations } from "@/hooks/use-organizations";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ORGANIZATION_STATUS } from "@/types/organizations";

import { EventCard } from "./event-card";
import { EventFilterSheet } from "./event-filter-sheet";
import { Hero } from "./hero";
import { SportFilter } from "./sport-filter";

export function HomeScreen() {
  const router = useRouter();
  const { scope: scopeParam, organizationId: organizationIdParam } =
    useLocalSearchParams<{ scope?: string; organizationId?: string }>();
  const initialScope: EventFeedScope =
    scopeParam === "friends" || scopeParam === "organizations"
      ? scopeParam
      : "all";
  const initialOrganizationId =
    initialScope === "organizations" ? (organizationIdParam ?? null) : null;
  const [filterOpen, setFilterOpen] = useState(false);
  const { requireAuth } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const { items: myOrganizations, isLoading: isOrganizationsLoading } =
    useMyOrganizations(isAuthenticated);
  const {
    events,
    totalCount,
    hasNext,
    isLoading,
    isRefreshing,
    isLoadingMore,
    sportFilter,
    setSportFilter,
    scope,
    setScope,
    filters,
    applyFilters,
    refresh,
    loadMore,
  } = useEvents(initialScope, initialOrganizationId);

  const approvedOrganizations = myOrganizations.filter(
    (organization) => organization.status === ORGANIZATION_STATUS.approved,
  );
  const hasOrganizations = approvedOrganizations.length > 0;
  const selectedOrganizationName = approvedOrganizations.find(
    (organization) => organization.id === filters.organizationId,
  )?.name;

  useEffect(() => {
    if (
      scope === "organizations" &&
      !isOrganizationsLoading &&
      !hasOrganizations
    ) {
      setScope("all");
    }
  }, [hasOrganizations, isOrganizationsLoading, scope, setScope]);

  useEffect(() => {
    if (
      filters.organizationId &&
      !isOrganizationsLoading &&
      !approvedOrganizations.some(
        (organization) => organization.id === filters.organizationId,
      )
    ) {
      applyFilters({ ...filters, organizationId: null });
    }
  }, [applyFilters, approvedOrganizations, filters, isOrganizationsLoading]);

  const isFriends = scope === "friends";
  const isOrganizations = scope === "organizations";
  const hasActiveFilters =
    filters.city != null ||
    filters.minAge !== DEFAULT_EVENT_FILTERS.minAge ||
    filters.maxAge !== DEFAULT_EVENT_FILTERS.maxAge ||
    filters.gender != null ||
    filters.skillLevel != null ||
    filters.isPaid != null ||
    filters.organizationId != null;

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
            Etkinlikler
          </Text>
          <View className="flex-row gap-sm">
            {hasActiveFilters ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtreleri temizle"
                onPress={() => applyFilters(DEFAULT_EVENT_FILTERS)}
                className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
              >
                <FontAwesome6
                  name="filter-circle-xmark"
                  size={17}
                  color={themeColors.text.secondary}
                />
              </Pressable>
            ) : null}

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
              {hasActiveFilters ? (
                <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background-primary bg-brand-primary" />
              ) : null}
            </Pressable>
          </View>
        </View>

        <SegmentedTabs
          options={[
            { key: "all", label: "Genel" },
            { key: "friends", label: "Arkadaşlarım" },
            ...(hasOrganizations
              ? [{ key: "organizations", label: "Organizasyonlarım" } as const]
              : []),
          ]}
          value={scope}
          onChange={(next) => {
            if (
              (next === "friends" || next === "organizations") &&
              !requireAuth(
                next === "friends"
                  ? "Arkadaşlarının etkinliklerini görmek için giriş yapmalısın."
                  : "Organizasyonlarının etkinliklerini görmek için giriş yapmalısın.",
              )
            ) {
              return;
            }
            setScope(next);
          }}
        />

        <View className="flex-row items-center gap-sm">
          <FontAwesome6
            name={
              isOrganizations
                ? "building"
                : isFriends
                  ? "user-group"
                  : "location-dot"
            }
            size={14}
            color={themeColors.text.primary}
          />
          <Text className="font-body-bold text-[15px] text-text-primary">
            {isOrganizations
              ? (selectedOrganizationName ?? "Organizasyonlarının etkinlikleri")
              : isFriends
                ? filters.city
                  ? `${filters.city} · Arkadaşlarının etkinlikleri`
                  : "Arkadaşlarının düzenlediği etkinlikler"
                : filters.city
                  ? `${filters.city} etkinlikleri`
                  : "Tüm şehirlerdeki etkinlikler"}
          </Text>
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
            {isOrganizations
              ? "Organizasyonlarının henüz yaklaşan bir etkinliği yok."
              : isFriends
                ? "Arkadaşların henüz yaklaşan bir etkinlik oluşturmamış."
                : "Bu filtrelere uygun yaklaşan etkinlik yok."}
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
        organizations={isOrganizations ? approvedOrganizations : []}
      />
    </TabPage>
  );
}
